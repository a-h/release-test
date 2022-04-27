#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const assertRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if(!value || value == "") {
    throw new Error(`Missing or empty required environment variable '${name}'`);
  }
  return value;
}

const app = new cdk.App();
new CdkStack(app, 'CdkStack', {
  repoName: assertRequiredEnv("REPO_NAME"),
  repoOwner: assertRequiredEnv("REPO_OWNER"),
  version: assertRequiredEnv("VERSION"),
})
