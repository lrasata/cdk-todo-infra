import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

export interface Todo {
    userId: string;
    todoId: string;
    title: string;
    completed: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface CreateTodoInput {
    userId: string;
    title: string;
}

export interface UpdateTodoInput {
    userId: string;
    todoId: string;
    completed: boolean;
}

export interface DeleteTodoInput {
    userId: string;
    todoId: string;
}

export class TodosRepository {
    private readonly client: DynamoDBDocumentClient;
    private readonly tableName: string;

    constructor(tableName: string, client?: DynamoDBDocumentClient) {
        this.tableName = tableName;
        this.client =
            client ?? DynamoDBDocumentClient.from(new DynamoDBClient({}));
    }

    async listByUser(userId: string): Promise<Todo[]> {
        const result = await this.client.send(
            new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: "userId = :uid",
                ExpressionAttributeValues: { ":uid": userId },
                ScanIndexForward: false, // newest first
            })
        );
        return (result.Items ?? []) as Todo[];
    }

    async create(input: CreateTodoInput): Promise<Todo> {
        const todo: Todo = {
            userId: input.userId,
            todoId: randomUUID(),
            title: input.title.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
        };
        await this.client.send(
            new PutCommand({ TableName: this.tableName, Item: todo })
        );
        return todo;
    }

    async update(input: UpdateTodoInput): Promise<Todo> {
        const result = await this.client.send(
            new UpdateCommand({
                TableName: this.tableName,
                Key: { userId: input.userId, todoId: input.todoId },
                UpdateExpression: "SET completed = :c, updatedAt = :u",
                ExpressionAttributeValues: {
                    ":c": input.completed,
                    ":u": new Date().toISOString(),
                },
                ConditionExpression: "attribute_exists(todoId)",
                ReturnValues: "ALL_NEW",
            })
        );
        return result.Attributes as Todo;
    }

    async delete(input: DeleteTodoInput): Promise<void> {
        await this.client.send(
            new DeleteCommand({
                TableName: this.tableName,
                Key: { userId: input.userId, todoId: input.todoId },
                ConditionExpression: "attribute_exists(todoId)",
            })
        );
    }
}