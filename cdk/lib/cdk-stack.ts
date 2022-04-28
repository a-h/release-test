import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecrdeploy from 'cdk-ecr-deployment';

export interface ReleaseTestStackProps extends StackProps {
        // Name of the repository owner, typically the organisation.
        repoOwner: string,
        // Name of the repository storing the Docker image.
        repoName: string,
        // Version number of the app to deploy, e.g. v1.0.1
        version: string,
}

export class ReleaseTestStack extends Stack {
        constructor(scope: Construct, id: string, props: ReleaseTestStackProps) {
                super(scope, id, props);

                if (!props.env || !props.env.region || !props.env.account) {
                        throw new Error("Invalid environment")
                }
                console.log("accountId:", props.env.account);
                console.log("region:", props.env.region);

                const permissionsBoundary = iam.ManagedPolicy.fromManagedPolicyName(this, 'permissionsBoundary', 'ci-permissions-boundary')
                iam.PermissionsBoundary.of(this).apply(permissionsBoundary);

                // Create an ECR repository.
                const repositoryName = "ReleaseTestECR";
                new ecr.Repository(this, "ecr", {
                        repositoryName,
                        imageScanOnPush: true,
                });

                // Copy from the Github source into ECR.
                const src = `ghcr.io/${props.repoOwner}/${props.repoName}:${props.version}`;
                const dest = `${props.env.account}.dkr.ecr.${props.env.region}.amazonaws.com/${repositoryName}:${props.version}`;
                console.log(`Copying from ${src} to ${dest}`);

                new ecrdeploy.ECRDeployment(this, 'copyFromGithubToECR', {
                        src: new ecrdeploy.DockerImageName(src),
                        dest: new ecrdeploy.DockerImageName(dest),
                });
        }
}
