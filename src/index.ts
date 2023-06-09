import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import dayjs from 'dayjs';

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.hasOwnProperty('Records')) {
      const records = event['Records'];
      console.log(records);
      const record = records[0];
      if (record.hasOwnProperty('body')) {
        const body = JSON.parse(record['body']);
        console.log(body);
        if (body.hasOwnProperty('message')) {
          console.log(body['message']);
        }
      }
    } else {
      console.log(event);
    }

    const day = dayjs().add(1, 'd');
    console.log(day.format('YYYY-MM-DD'));

    // 60s 待つ
    await sleep(60000);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello, AWS Lambda!' }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: '500エラーです' }),
    };
  }
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
