import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { EnvConfig } from '../config/environments';

interface WafStackProps extends cdk.StackProps {
    config: EnvConfig;
}

export class WafStack extends cdk.Stack {
    public readonly webAclArn: string;

    constructor(scope: Construct, id: string, props: WafStackProps) {
        super(scope, id, props);

        const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
            name: `todo-waf-${props.config.stage}`,
            scope: 'CLOUDFRONT',
            defaultAction: { allow: {} },
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: `todo-waf-${props.config.stage}`,
                sampledRequestsEnabled: true,
            },
            rules: [
                {
                    name: 'AWSManagedRulesCommonRuleSet',
                    priority: 1,
                    overrideAction: { none: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'CommonRuleSet',
                        sampledRequestsEnabled: true,
                    },
                    statement: {
                        managedRuleGroupStatement: {
                            vendorName: 'AWS',
                            name: 'AWSManagedRulesCommonRuleSet',
                        },
                    },
                },
                {
                    name: 'RateLimit',
                    priority: 2,
                    action: { block: {} },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'RateLimit',
                        sampledRequestsEnabled: true,
                    },
                    statement: {
                        rateBasedStatement: {
                            limit: 1000,
                            aggregateKeyType: 'IP',
                        },
                    },
                },
            ],
        });

        this.webAclArn = webAcl.attrArn;

        new cdk.CfnOutput(this, 'WebAclArn', {
            value: webAcl.attrArn,
            exportName: `TodoWafArn-${props.config.stage}`,
        });
    }
}