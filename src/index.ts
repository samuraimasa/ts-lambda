import { APIGatewayEvent, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import dayjs from 'dayjs';

export const handler: Handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    if (event.hasOwnProperty('key')) {
      console.log(event['key']);
    }

    const day = dayjs().add(1, 'd');
    console.log(day.format('YYYY-MM-DD'));

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
