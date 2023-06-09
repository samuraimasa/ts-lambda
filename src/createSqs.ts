import { CreateEventSourceMappingCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  ChangeMessageVisibilityCommand,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

import dotenv from 'dotenv';
dotenv.config();

async function createQueue(queueName: string) {
  try {
    const command = new CreateQueueCommand({
      QueueName: queueName,
      Attributes: {
        FifoQueue: 'true',
        ReceiveMessageWaitTimeSeconds: '20',
        DeduplicationScope: 'messageGroup',
        FifoThroughputLimit: 'perMessageGroupId',
        VisibilityTimeout: '900', // 15minの可視性タイムアウト
        // MessageRetentionPeriod: '3600', // 1h以内に処理が終わらない場合、キューから削除
        MessageRetentionPeriod: '1800', // 1h以内に処理が終わらない場合、キューから削除
      },
    });

    const response = await sqs.send(command);
    console.info('Queue created:', response);
    return response.QueueUrl;
  } catch (error) {
    console.error('Error creating queue:', error);
  }
}

async function mappingLambda(sqs: SQSClient, queueUrl: string) {
  try {
    const getQueueAttributesCommand = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn'],
    });
    const queueAttributes = await sqs.send(getQueueAttributesCommand);
    console.info('Queue attributes:', queueAttributes);

    const lambdaArn = 'arn:aws:lambda:ap-northeast-1:392043608200:function:sano-sample-dev-hello';
    const createEventSourceMappingCommand = new CreateEventSourceMappingCommand({
      EventSourceArn: queueAttributes.Attributes?.QueueArn as string,
      FunctionName: lambdaArn,
      BatchSize: 1,
      Enabled: true,
    });
    const lambda = new LambdaClient({ region: 'ap-northeast-1', credentials });
    const lambdaResponse = await lambda.send(createEventSourceMappingCommand);

    console.info('Lambda mapping queue:', lambdaResponse);
  } catch (error) {
    console.error('Error Lambda mapping queue:', error);
  }
}

async function changeMessageVisibility(sqs: SQSClient, queueUrl: string) {
  try {
    // キューの可視性タイムアウトを30秒に変更
    const command = new ChangeMessageVisibilityCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: 'handle', // メッセージのハンドル
      VisibilityTimeout: 30,
    });
    const response = await sqs.send(command);
    console.info('ChangeMessageVisibility:', response);
  } catch (error) {
    console.error('Error changeMessageVisibility queue:', error);
  }
}

async function sendMessage(sqs: SQSClient, queueUrl: string) {
  try {
    const parallelCnt = 1000;
    // 20000件のグループを作成する
    for (let i = 1; i <= 2; i++) {
      const messageGroupId = i % parallelCnt;
      // キューにメッセージを送信
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({ message: `value${i}` }), // 送信する JSON メッセージの内容
        MessageGroupId: `group${messageGroupId}`, // FIFO キューの場合、メッセージグループIDを指定
        MessageDeduplicationId: Date.now().toString(), // 重複排除のためのIDを指定,
      });

      const sendMessageResponse = await sqs.send(command);
      console.info('Message sent:', sendMessageResponse);
    }
  } catch (error) {
    console.error('Error sendMessage:', error);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const credentials = {
  accessKeyId: process.env.accessKeyId as string,
  secretAccessKey: process.env.secretAccessKey as string,
};

// SQS クライアントの初期化
const sqs = new SQSClient({ region: 'ap-northeast-1', credentials });

// キュー名
const queueName = 'outside-reservation-queue-test.fifo';

async function main() {
  const queueUrl = await createQueue(queueName);
  await mappingLambda(sqs, queueUrl as string);
  await sendMessage(sqs, queueUrl as string);
}
main();
