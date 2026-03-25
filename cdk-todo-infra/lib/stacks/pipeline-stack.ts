import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { environments } from '../config/environments';
import { TodoAppStage } from './todo-app-stage';

interface PipelineStackProps extends cdk.StackProps {
    codestarConnectionArn: string;
    repo: string;
    branch?: string;
}

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);

        const source = pipelines.CodePipelineSource.connection(
            props.repo,
            props.branch ?? 'main',
            {
                connectionArn: props.codestarConnectionArn,
                triggerOnPush: true,
            }
        );

        const synthStep = new pipelines.ShellStep('Synth', {
            input: source,
            primaryOutputDirectory: 'cdk-todo-infra/cdk.out',
            commands: [
                // Use Node 20
                'n 20 && node --version',
                // Install backend deps
                'cd todo-backend && npm ci && cd ..',
                // Build frontend
                'cd todo-frontend && npm ci && npm run build && cd ..',
                // Synth CDK app
                'cd cdk-todo-infra && npm ci && npx cdk synth',
            ],
            env: {
                DOMAIN_NAME: process.env.DOMAIN_NAME!,
                CDK_ACCOUNT: process.env.CDK_ACCOUNT!,
            },
        });

        const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
            pipelineName: 'todo-app-pipeline',
            synth: synthStep,
            selfMutation: true,
            dockerEnabledForSynth: true,
            codeBuildDefaults: {
                buildEnvironment: {
                    buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                    computeType: codebuild.ComputeType.SMALL,
                    environmentVariables: {
                        DOMAIN_NAME: { value: process.env.DOMAIN_NAME! },
                        CDK_ACCOUNT: { value: process.env.CDK_ACCOUNT! },
                    },
                },
            },
        });

        // Dev stage
        pipeline.addStage(
            new TodoAppStage(this, 'Dev', {
                env: {
                    account: environments.dev.account,
                    region: environments.dev.region,
                },
                config: environments.dev,
            })
        );

        // Staging stage
        pipeline.addStage(
            new TodoAppStage(this, 'Staging', {
                env: {
                    account: environments.staging.account,
                    region: environments.staging.region,
                },
                config: environments.staging,
            })
        );

        // Prod stage — manual approval gate
        pipeline.addStage(
            new TodoAppStage(this, 'Prod', {
                env: {
                    account: environments.prod.account,
                    region: environments.prod.region,
                },
                config: environments.prod,
            }),
            {
                pre: [
                    new pipelines.ManualApprovalStep('ApproveProdDeploy'),
                ],
            }
        );
    }
}