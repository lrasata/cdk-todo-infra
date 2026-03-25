import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { EnvConfig } from '../config/environments';

interface FrontendStackProps extends cdk.StackProps {
    config: EnvConfig;
    certificateArn: string;
    webAclArn: string;
    apiDomain: string;
    apiStage: string;
}

export class FrontendStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: FrontendStackProps) {
        super(scope, id, props);

        // Private S3 bucket
        const bucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `todo-website-${props.config.stage}-${props.config.account}`,
            removalPolicy: props.config.removalPolicy,
            autoDeleteObjects: props.config.removalPolicy === cdk.RemovalPolicy.DESTROY,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
        });

        // Origin Access Control
        const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
            description: `OAC for todo-${props.config.stage}`,
        });

        const certificate = acm.Certificate.fromCertificateArn(
            this,
            'Certificate',
            props.certificateArn
        );


        // API Gateway origin — CloudFront forwards /api/* to API Gateway
        // We strip the /api prefix before forwarding so API Gateway sees /todos not /api/todos
        const apiOrigin = new origins.HttpOrigin(props.apiDomain, {
            originPath: `/${props.apiStage}`,
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        });

        // Cache policy for API — never cache API responses
        const apiCachePolicy = new cloudfront.CachePolicy(this, 'ApiCachePolicy', {
            cachePolicyName: `todo-api-no-cache-${props.config.stage}`,
            defaultTtl: cdk.Duration.seconds(0),
            minTtl: cdk.Duration.seconds(0),
            maxTtl: cdk.Duration.seconds(0),
        });

        // Origin request policy — forward headers needed by the API
        const apiOriginRequestPolicy = new cloudfront.OriginRequestPolicy(
            this,
            'ApiOriginRequestPolicy',
            {
                originRequestPolicyName: `todo-api-origin-policy-${props.config.stage}`,
                headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
                    'X-User-Id',
                    'Content-Type'
                ),
                queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.none(),
                cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
            }
        );

        // CloudFront distribution
        const distribution = new cloudfront.Distribution(this, 'Distribution', {
            comment: `todo-${props.config.stage}`,
            domainNames: [props.config.subDomain],
            certificate,
            webAclId: props.webAclArn,

            // Default behavior — serve React app from S3
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
                    originAccessControl: oac,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
            },

            // /api/* behavior — forward to API Gateway
            // CloudFront rewrites /api/todos → /todos before hitting API Gateway
            additionalBehaviors: {
                '/api/*': {
                    origin: apiOrigin,
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL, // GET, POST, PATCH, DELETE
                    cachePolicy: apiCachePolicy,
                    originRequestPolicy: apiOriginRequestPolicy,
                },
            },

            // SPA routing — send 403/404 back to index.html for React Router
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.seconds(0),
                },
            ],
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        });

        // Deploy frontend assets to S3
        new s3deploy.BucketDeployment(this, 'Deploy', {
            sources: [s3deploy.Source.asset('../todo-frontend/dist')],
            destinationBucket: bucket,
            distribution,
            distributionPaths: ['/*'],
        });

        // Route53 records
        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: props.config.domainName,
        });

        new route53.ARecord(this, 'AliasRecord', {
            zone: hostedZone,
            recordName: props.config.subDomain,
            target: route53.RecordTarget.fromAlias(
                new targets.CloudFrontTarget(distribution)
            ),
        });

        new route53.AaaaRecord(this, 'AaaaRecord', {
            zone: hostedZone,
            recordName: props.config.subDomain,
            target: route53.RecordTarget.fromAlias(
                new targets.CloudFrontTarget(distribution)
            ),
        });

        new cdk.CfnOutput(this, 'SiteUrl', {
            value: `https://${props.config.subDomain}`,
        });

        new cdk.CfnOutput(this, 'DistributionId', {
            value: distribution.distributionId,
        });
    }
}