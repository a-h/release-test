#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ReleaseTestStack } from '../lib/cdk-stack';

const assertRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if(!value || value == "") {
    throw new Error(`Missing or empty required environment variable '${name}'`);
  }
  return value;
}

const app = new cdk.App();
new ReleaseTestStack(app, 'ReleaseTestStack', {
  repoOwner: assertRequiredEnv("REPO_OWNER"),
  repoName: assertRequiredEnv("REPO_NAME"),
  version: assertRequiredEnv("VERSION"),
  env: {
    region: assertRequiredEnv("AWS_REGION"),
    account: assertRequiredEnv("AWS_ACCOUNT_ID"),
  },
  githubTokenSecretArn: assertRequiredEnv("GITHUB_TOKEN_SECRET_ARN"),
})
