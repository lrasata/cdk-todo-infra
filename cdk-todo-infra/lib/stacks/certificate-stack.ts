import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import {EnvConfig} from "../config/environments";

interface CertificateStackProps extends cdk.StackProps {
    config: EnvConfig;
}

export class CertificateStack extends cdk.Stack {
    public readonly certificateArn: string;

    constructor(scope: Construct, id: string, props: CertificateStackProps) {
        super(scope, id, props);

        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: props.config.domainName,
        });

        const certificate = new acm.Certificate(this, 'Certificate', {
            domainName: props.config.subDomain,
            validation: acm.CertificateValidation.fromDns(hostedZone),
        });

        this.certificateArn = certificate.certificateArn;

        new cdk.CfnOutput(this, 'CertificateArn', {
            value: certificate.certificateArn,
            exportName: `TodoCertArn-${props.config.stage}`,
        });
    }
}