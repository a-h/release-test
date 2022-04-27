#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CIRoleStack } from '../lib/ci-role-stack';

const app = new cdk.App();
new CIRoleStack(app, 'CIRoleStack', {});
