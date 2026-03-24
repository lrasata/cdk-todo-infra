import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { TodosRepository } from "./todos.repository";
import {
    ok,
    created,
    noContent,
    badRequest,
    unauthorized,
    notFound,
    internalError,
} from "./http";

const repo = new TodosRepository(process.env.TABLE_NAME!);

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    // CORS preflight
    if (event.httpMethod === "OPTIONS") return ok({});

    // Every request must identify the user
    const userId =
        event.headers["X-User-Id"] ?? event.headers["x-user-id"];
    if (!userId) return unauthorized("X-User-Id header is required");

    const todoId = event.pathParameters?.todoId;
    const method = event.httpMethod;

    try {
        // GET /todos
        if (method === "GET" && !todoId) {
            const todos = await repo.listByUser(userId);
            return ok({ todos });
        }

        // POST /todos
        if (method === "POST") {
            const body = JSON.parse(event.body ?? "{}");
            if (!body.title?.trim()) return badRequest("title is required");
            const todo = await repo.create({ userId, title: body.title });
            return created(todo);
        }

        // PATCH /todos/:todoId
        if (method === "PATCH" && todoId) {
            const body = JSON.parse(event.body ?? "{}");
            if (typeof body.completed !== "boolean")
                return badRequest("completed (boolean) is required");
            const todo = await repo.update({ userId, todoId, completed: body.completed });
            return ok(todo);
        }

        // DELETE /todos/:todoId
        if (method === "DELETE" && todoId) {
            await repo.delete({ userId, todoId });
            return noContent();
        }

        return notFound("Route not found");
    } catch (e: any) {
        if (e.name === "ConditionalCheckFailedException") {
            return notFound("Todo not found");
        }
        console.error("[handler] Unexpected error:", e);
        return internalError();
    }
};