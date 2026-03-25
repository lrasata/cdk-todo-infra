#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/stacks/api-stack';
import { CertificateStack } from '../lib/stacks/certificate-stack';
import { WafStack } from '../lib/stacks/waf-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { PipelineStack } from '../lib/stacks/pipeline-stack';
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

// ── Manual stacks (used locally / before pipeline exists) ──────────────────

const certStack = new CertificateStack(app, `CertStack-${stage}`, {
    env: usEast1Env,
    crossRegionReferences: true,
    config,
});

const wafStack = new WafStack(app, `WafStack-${stage}`, {
    env: usEast1Env,
    crossRegionReferences: true,
    config,
});

const apiStack = new ApiStack(app, `ApiStack-${stage}`, {
    env: mainEnv,
    config,
});

new FrontendStack(app, `FrontendStack-${stage}`, {
    env: mainEnv,
    crossRegionReferences: true,
    config,
    certificateArn: certStack.certificateArn,
    webAclArn: wafStack.webAclArn,
    apiDomain: apiStack.apiDomain,
    apiStage: apiStack.apiStage,
});

// ── Pipeline stack (deploys and manages itself after first deploy) ──────────

new PipelineStack(app, 'PipelineStack', {
    env: mainEnv,
    codestarConnectionArn: process.env.CODESTAR_CONNECTION_ARN!,
    repo: 'lrasata/cdk-todo-infra',
    branch: 'main',
});