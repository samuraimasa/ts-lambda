import { Lambda, SQS } from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function createQueue(queueName: string) {
  try {
    // キューを作成
    const response = await sqs
      .createQueue({
        QueueName: queueName,
        Attributes: {
          FifoQueue: 'true',
          ReceiveMessageWaitTimeSeconds: '20',
          DeduplicationScope: 'messageGroup',
          FifoThroughputLimit: 'perMessageGroupId',
          VisibilityTimeout: '60', // 1分の可視性タイムアウト
        },
      })
      .promise();
    console.log('Queue created:', response);
    return response.QueueUrl;
  } catch (error) {
    console.error('Error creating queue:', error);
  }
}

async function mappingLambda(sqs: SQS, queueUrl: string) {
  try {
    // キューの属性を取得
    const queueAttributes = await sqs
      .getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ['QueueArn'],
      })
      .promise();
    console.log('Queue attributes:', queueAttributes);

    // キューとlambdaを連携する
    const lambda = new Lambda({ region: 'ap-northeast-1', credentials });
    const lambdaArn = 'arn:aws:lambda:ap-northeast-1:392043608200:function:sano-sample-dev-hello';
    const lambdaResponse = await lambda
      .createEventSourceMapping({
        EventSourceArn: queueAttributes.Attributes?.QueueArn as string,
        FunctionName: lambdaArn,
        BatchSize: 1,
        Enabled: true,
      })
      .promise();
    console.log('Lambda mapping queue:', lambdaResponse);
  } catch (error) {
    console.error('Error Lambda mapping queue:', error);
  }
}

async function changeMessageVisibility(sqs: SQS, queueUrl: string) {
  try {
    // キューの可視性タイムアウトを30秒に変更
    const response = await sqs
      .changeMessageVisibility({
        QueueUrl: queueUrl,
        ReceiptHandle: 'all', // ここの指定がよくわからない
        VisibilityTimeout: 30,
      })
      .promise();
    console.log('Queue created:', response);
  } catch (error) {
    console.error('Error changeMessageVisibility queue:', error);
  }
}

async function sendMessage(sqs: SQS, queueUrl: string) {
  try {
    // 1000件のグループを作成する
    for (let i = 0; i < 2000; i++) {
      // 10件のメッセージを作成する
      for (let j = 0; j < 10; j++) {
        // キューにメッセージを送信
        const sendMessageResponse = await sqs
          .sendMessage({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify({ message: `value${i}_${j}` }), // 送信する JSON メッセージの内容
            MessageGroupId: `group${i}`, // FIFO キューの場合、メッセージグループIDを指定
            MessageDeduplicationId: Date.now().toString(), // 重複排除のためのIDを指定,
          })
          .promise();
        console.log('Message sent:', sendMessageResponse);
      }
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
const sqs = new SQS({ region: 'ap-northeast-1', credentials });

// キュー名
const queueName = 'test-queue2.fifo';

async function main() {
  const queueUrl = await createQueue(queueName);
  // await mappingLambda(sqs, queueUrl as string);
  await sendMessage(sqs, queueUrl as string);
}
main();
