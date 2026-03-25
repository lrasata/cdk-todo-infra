import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvConfig } from '../config/environments';
import { ApiStack } from './api-stack';
import { CertificateStack } from './certificate-stack';
import { WafStack } from './waf-stack';
import { FrontendStack } from './frontend-stack';

interface TodoAppStageProps extends cdk.StageProps {
    config: EnvConfig;
}

export class TodoAppStage extends cdk.Stage {
    constructor(scope: Construct, id: string, props: TodoAppStageProps) {
        super(scope, id, props);

        const { config } = props;

        const usEast1Env = {
            account: config.account,
            region: 'us-east-1',
        };

        const mainEnv = {
            account: config.account,
            region: config.region,
        };

        const certStack = new CertificateStack(this, `CertStack-${config.stage}`, {
            env: usEast1Env,
            crossRegionReferences: true,
            config,
        });

        const wafStack = new WafStack(this, `WafStack-${config.stage}`, {
            env: usEast1Env,
            crossRegionReferences: true,
            config,
        });

        const apiStack = new ApiStack(this, `ApiStack-${config.stage}`, {
            env: mainEnv,
            config,
        });

        new FrontendStack(this, `FrontendStack-${config.stage}`, {
            env: mainEnv,
            crossRegionReferences: true,
            config,
            certificateArn: certStack.certificateArn,
            webAclArn: wafStack.webAclArn,
            apiDomain: apiStack.apiDomain,
            apiStage: apiStack.apiStage,
        });
    }
}