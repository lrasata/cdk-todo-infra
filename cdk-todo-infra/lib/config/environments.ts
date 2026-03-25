import * as cdk from 'aws-cdk-lib';

export type Stage = 'dev' | 'staging' | 'prod';

export interface EnvConfig {
    stage: Stage;
    account: string;
    region: string;
    domainName: string;      // e.g. "yourdomain.com"
    subDomain: string;       // e.g. "dev.yourdomain.com"
    removalPolicy: cdk.RemovalPolicy;
}

const account = process.env.CDK_ACCOUNT!;
const domainName = process.env.DOMAIN_NAME!;

export const environments: Record<Stage, EnvConfig> = {
    dev: {
        stage: 'dev',
        account,
        region: 'eu-central-1',
        domainName,
        subDomain: `dev.${domainName}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    },
    staging: {
        stage: 'staging',
        account,
        region: 'eu-central-1',
        domainName,
        subDomain: `staging.${domainName}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    },
    prod: {
        stage: 'prod',
        account,
        region: 'eu-central-1',
        domainName,
        subDomain: domainName,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
    },
};

export function getConfig(stage: string): EnvConfig {
    if (!['dev', 'staging', 'prod'].includes(stage)) {
        throw new Error(`Unknown stage: ${stage}`);
    }
    return environments[stage as Stage];
}