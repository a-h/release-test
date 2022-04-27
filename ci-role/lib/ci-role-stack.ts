import * as cdk from '@aws-cdk/core';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CIRoleStack extends Stack {
        constructor(scope: Construct, id: string, props?: StackProps) {
                super(scope, id, props);

                const pb = createPermissionsBoundary(this)
                const roleCreatorPolicy = createRoleCreatorPolicy(this)
                // TODO: Configure your allowed Github repos.
                const allowedRepos = [
                        "repo:a-h/release-test:ref:refs/heads/main",
                ]
                const role = createGithubRole(this, allowedRepos, pb, roleCreatorPolicy);
                new CfnOutput(this, "GithubRole", { value: role.roleArn })
        }
}

const conditionRestrictToRegions = {
        "StringEquals": {
                "aws:RequestedRegion": [
                        "us-east-1", // Allow North Virginia for global services.
                        "eu-west-1", // Europe.
                ],
        }
};

const createPermissionsBoundary = (stack: Stack): iam.ManagedPolicy => {
        const pb = new iam.ManagedPolicy(stack, "PermissionsBoundary", {
                managedPolicyName: "ci-permissions-boundary",
                description: "Permission boundary to limit permissions of roles created by CI/CD user.",
        })
        // Allow reading IAM information, tagging, and simulating policies.
        pb.addStatements(new iam.PolicyStatement({
                sid: "AllowIAMReadOnly",
                effect: iam.Effect.ALLOW,
                actions: [
                        "iam:Get*",
                        "iam:List*",
                        "iam:SimulatePrincipalPolicy",
                        "iam:Tag*",
                        "iam:Untag*",
                ],
                resources: ["*"],
        }));
        // Allow services that need a wildcard resource ID because the resource path is unknown in advance e.g. API Gateway.
        pb.addStatements(new iam.PolicyStatement({
                sid: "AllowServerlessServices",
                effect: iam.Effect.ALLOW,
                actions: [
                        "batch:*",
                        "cognito-idp:*",
                        "execute-api:*",
                        "dynamodb:*",
                        "ec2:AssignPrivateIpAddresses",
                        "ec2:CreateNetworkInterface",
                        "ec2:DeleteNetworkInterface",
                        "ec2:Describe*",
                        "ec2:UnassignPrivateIpAddresses",
                        "ecs:*",
                        "events:*",
                        "kms:*",
                        "lambda:*",
                        "logs:*",
                        "s3:*",
                        "schemas:*",
                        "secretsmanager:GetSecretValue", // Only allow retrival of secrets.
                        "ses:*",                         // Unknown email at the moment
                        "sns:*",
                        "sqs:*",
                        "ecr:*",
                        "apprunner:*",
                        "ssm:*", // Alow SSM parameter store.
                        "ssmmessages:*",
                        "states:*",
                        "synthetics:*",
                        "xray:*",
                ],
                "resources": ["*"],
                conditions: conditionRestrictToRegions,
        }))
        // Allow CloudFormation deployment.
        pb.addStatements(new iam.PolicyStatement({
                sid: "AllowCloudFormationDeployment",
                effect: iam.Effect.ALLOW,
                actions: [
                        "cloudformation:CreateStack",
                        "cloudformation:DescribeStackEvents",
                        "cloudformation:DescribeStackResources",
                        "cloudformation:DescribeStackResource",
                        "cloudformation:DescribeStacks",
                        "cloudformation:GetTemplate",
                        "cloudformation:ListStackResources",
                        "cloudformation:UpdateStack",
                        "cloudformation:ValidateTemplate",
                        "cloudformation:DeleteStack",
                ],
                resources: ["*"],
                conditions: conditionRestrictToRegions,
        }))
        // Allow validation of any stack.
        pb.addStatements(new iam.PolicyStatement({
                sid: "AllowValidationOfAnyStack",
                effect: iam.Effect.ALLOW,
                actions: [
                        "cloudformation:ValidateTemplate",
                ],
                resources: ["*"],
                conditions: conditionRestrictToRegions,
        }))
        // Deny permissions boundary alteration.
        const arn = cdk.Fn.sub("arn:aws:iam::${AWS::AccountId}:policy/ci-permissions-boundary")
        pb.addStatements(new iam.PolicyStatement({
                sid: "DenyPermissionsBoundaryAlteration",
                effect: iam.Effect.DENY,
                actions: [
                        "iam:CreatePolicyVersion",
                        "iam:DeletePolicy",
                        "iam:DeletePolicyVersion",
                        "iam:SetDefaultPolicyVersion",
                ],
                resources: [arn],
        }))
        // Deny removal of permissions boundary from any role.
        pb.addStatements(new iam.PolicyStatement({
                sid: "DenyPermissionsBoundaryRemoval",
                effect: iam.Effect.DENY,
                actions: [
                        "iam:DeleteRolePermissionsBoundary",
                ],
                resources: ["arn:aws:iam:::role/*"]
        }))
        // Allow permissions boundaries to be applied.
        pb.addStatements(new iam.PolicyStatement({
                sid: "AllowUpsertRoleIfPermBoundaryIsBeingApplied",
                effect: iam.Effect.ALLOW,
                actions: [
                        "iam:CreateRole",
                        "iam:PutRolePolicy",
                        "iam:PutRolePermissionsBoundary",
                ],
                resources: ["arn:aws:iam:::role/*", "arn:aws:iam:::policy/*"],
                conditions: {
                        "StringEquals": { "iam:PermissionsBoundary": arn },
                }
        }))
        // Allow roles to be deleted.
        pb.addStatements(new iam.PolicyStatement({
                sid: "AllowDeleteRole",
                effect: iam.Effect.ALLOW,
                actions: [
                        "iam:DetachRolePolicy",
                        "iam:DeleteRolePolicy",
                        "iam:DeleteRole",
                        "iam:DeletePolicy",
                ],
                resources: ["arn:aws:iam:::role/*"],
        }))
        return pb

}

const createRoleCreatorPolicy = (stack: Stack): iam.ManagedPolicy => new iam.ManagedPolicy(stack, "CIRoleCreator", {
        description: "Allows CI users to create roles, should be used with the permission boundary.",
        statements: [
                new iam.PolicyStatement({
                        sid: "passRole",
                        effect: iam.Effect.ALLOW,
                        actions: [
                                "iam:PassRole*",
                                "iam:CreateInstanceProfile",
                                "iam:RemoveRoleFromInstanceProfile",
                                "iam:AddRoleToInstanceProfile",
                                "iam:DeleteInstanceProfile",
                                "iam:GetRole",
                                "iam:CreateRole",
                                "iam:PutRolePolicy",
                                "iam:DeleteRolePolicy",
                                "iam:DeleteRole",
                                "iam:DetachRolePolicy",
                                "iam:List*",
                                "iam:SimulatePrincipalPolicy",
                                "iam:AttachRolePolicy",
                                "iam:DetachRolePolicy",
                                "iam:PutRolePermissionsBoundary",
                                "iam:Tag*",
                                "iam:Untag*",
                        ],
                        resources: ["*"],
                }),
        ]
});

const createGithubRole = (stack: Stack, allowedRepos: Array<string>, permissionsBoundary: iam.ManagedPolicy, roleCreatorPolicy: iam.ManagedPolicy): iam.Role => {
        const oidc = new iam.OpenIdConnectProvider(stack, "GithubOIDCProvider", {
                url: "https://token.actions.githubusercontent.com",
                thumbprints: ["15E29108718111E59B3DAD31954647E3C344A231"],
                clientIds: ["sts.amazonaws.com"],
        })
        const principal = new iam.FederatedPrincipal(oidc.openIdConnectProviderArn,
                {
                        "StringLike": {
                                "token.actions.githubusercontent.com:sub": allowedRepos,
                        },
                },
                "sts:AssumeRoleWithWebIdentity",
        )
        return new iam.Role(stack, "GithubRole", {
                managedPolicies: [
                        iam.ManagedPolicy.fromAwsManagedPolicyName("PowerUserAccess"),
                        roleCreatorPolicy,
                ],
                assumedBy: principal,
                permissionsBoundary: permissionsBoundary,
        })
}
