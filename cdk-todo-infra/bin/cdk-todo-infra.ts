#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/stacks/api-stack';
import {getConfig} from "../lib/config/environment";

const app = new cdk.App();

const stage = process.env.STAGE ?? 'dev';
const config = getConfig(stage);

new ApiStack(app, `ApiStack-${stage}`, {
    env: {
        account: config.account,
        region: config.region,
    },
    config,
});