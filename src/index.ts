import { APIGatewayEvent, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';

export const handler: Handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Hello, AWS Lambda!');
    console.log(event, context);
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
}
