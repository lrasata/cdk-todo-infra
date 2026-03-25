import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import {EnvConfig} from "../config/environments";

interface ApiStackProps extends cdk.StackProps {
    config: EnvConfig;
}

export class ApiStack extends cdk.Stack {
    public readonly apiUrl: string;
    public readonly apiDomain: string;
    public readonly apiStage: string;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        // DynamoDB table
        const table = new dynamodb.Table(this, 'TodosTable', {
            tableName: `todos-${props.config.stage}`,
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'todoId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: props.config.removalPolicy,
        });

        // Lambda function
        const todoHandler = new lambda.NodejsFunction(this, 'TodoHandler', {
            functionName: `todo-handler-${props.config.stage}`,
            runtime: Runtime.NODEJS_22_X,
            entry: path.join(__dirname, '../../../todo-backend/src/handler.ts'),
            handler: 'handler',
            environment: {
                TABLE_NAME: table.tableName,
            },
            logGroup: new logs.LogGroup(this, 'TodoHandlerLogs', {
                logGroupName: `/aws/lambda/todo-handler-${props.config.stage}`,
                retention: props.config.stage === 'prod'
                    ? logs.RetentionDays.ONE_MONTH
                    : logs.RetentionDays.ONE_WEEK,
                removalPolicy: props.config.removalPolicy,
            }),
            bundling: {
                minify: props.config.stage === 'prod',
                sourceMap: props.config.stage !== 'prod',
            },
        });

        // Grant Lambda read/write access to DynamoDB
        table.grantReadWriteData(todoHandler);

        // API Gateway
        const api = new apigateway.RestApi(this, 'TodosApi', {
            restApiName: `todos-api-${props.config.stage}`,
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type', 'X-User-Id'],
            },
            deployOptions: {
                stageName: props.config.stage,
            },
        });

        const lambdaIntegration = new apigateway.LambdaIntegration(todoHandler);

        const api_resource = api.root.addResource('api');
        const todos = api_resource.addResource('todos');
        todos.addMethod('GET', lambdaIntegration);
        todos.addMethod('POST', lambdaIntegration);

        const todo = todos.addResource('{todoId}');
        todo.addMethod('PATCH', lambdaIntegration);
        todo.addMethod('DELETE', lambdaIntegration);

        this.apiUrl = api.url;
        this.apiDomain = `${api.restApiId}.execute-api.${this.region}.amazonaws.com`;
        this.apiStage = props.config.stage;

        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url,
            exportName: `TodoApiUrl-${props.config.stage}`,
        });
    }
}