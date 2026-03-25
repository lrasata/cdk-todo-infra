#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/stacks/api-stack';
import { CertificateStack } from '../lib/stacks/certificate-stack';
import { WafStack } from '../lib/stacks/waf-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { getConfig } from '../lib/config/environments';

const app = new cdk.App();

const stage = process.env.STAGE ?? 'dev';
const config = getConfig(stage);

const usEast1Env = {
    account: config.account,
    region: 'us-east-1',
};

const mainEnv = {
    account: config.account,
    region: config.region,
};

// Certificate — must be in us-east-1 for CloudFront
const certStack = new CertificateStack(app, `CertStack-${stage}`, {
    env: usEast1Env,
    crossRegionReferences: true,
    config,
});

// WAF — must be in us-east-1 for CloudFront scope
const wafStack = new WafStack(app, `WafStack-${stage}`, {
    env: usEast1Env,
    crossRegionReferences: true,
    config,
});

// API — Lambda + DynamoDB + API Gateway
const apiStack = new ApiStack(app, `ApiStack-${stage}`, {
    env: mainEnv,
    config,
});

// Frontend — S3 + CloudFront + Route53
// apiStack.apiUrl is passed so CloudFront can forward /api/* to API Gateway
new FrontendStack(app, `FrontendStack-${stage}`, {
    env: mainEnv,
    crossRegionReferences: true,
    config,
    certificateArn: certStack.certificateArn,
    webAclArn: wafStack.webAclArn,
    apiDomain: apiStack.apiDomain,
    apiStage: apiStack.apiStage,
});