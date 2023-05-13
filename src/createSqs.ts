import { SQS } from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

async function createQueue() {
  const credentials = {
    accessKeyId: process.env.accessKeyId as string,
    secretAccessKey: process.env.secretAccessKey as string,
  };

  // SQS クライアントの初期化
  const sqs = new SQS({ region: 'ap-northeast-1', credentials });

  // キュー名
  const queueName = 'test-queue.fifo';

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
        },
      })
      .promise();
    console.log('Queue created:', response);

    // キューにメッセージを送信
    let sendMessageResponse = await sqs
      .sendMessage({
        QueueUrl: response.QueueUrl as string,
        MessageBody: JSON.stringify({ key: 'value' }), // 送信する JSON メッセージの内容
        MessageGroupId: 'group1', // FIFO キューの場合、メッセージグループIDを指定
        MessageDeduplicationId: Date.now().toString(), // 重複排除のためのIDを指定,
      })
      .promise();
    console.log('Message sent:', sendMessageResponse);

    await sleep(1000);

    sendMessageResponse = await sqs
      .sendMessage({
        QueueUrl: response.QueueUrl as string,
        MessageBody: JSON.stringify({ key: 'value2' }), // 送信する JSON メッセージの内容
        MessageGroupId: 'group1', // FIFO キューの場合、メッセージグループIDを指定
        MessageDeduplicationId: Date.now().toString(), // 重複排除のためのIDを指定,
      })
      .promise();
    console.log('Message sent:', sendMessageResponse);
  } catch (error) {
    console.error('Error creating queue:', error);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// createQueue 関数を呼び出す
createQueue();
