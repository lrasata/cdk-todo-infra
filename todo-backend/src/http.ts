import { APIGatewayProxyResult } from "aws-lambda";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-User-Id",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

export const ok = (body: unknown, status = 200): APIGatewayProxyResult => ({
    statusCode: status,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
});

export const created = (body: unknown): APIGatewayProxyResult =>
    ok(body, 201);

export const noContent = (): APIGatewayProxyResult => ({
    statusCode: 204,
    headers: CORS_HEADERS,
    body: "",
});

export const badRequest = (message: string): APIGatewayProxyResult =>
    error(message, 400);

export const unauthorized = (message: string): APIGatewayProxyResult =>
    error(message, 401);

export const notFound = (message: string): APIGatewayProxyResult =>
    error(message, 404);

export const internalError = (): APIGatewayProxyResult =>
    error("Internal server error", 500);

const error = (message: string, status: number): APIGatewayProxyResult => ({
    statusCode: status,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
});