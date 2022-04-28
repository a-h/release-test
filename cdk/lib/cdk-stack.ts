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

export class CdkStack extends Stack {
        constructor(scope: Construct, id: string, props: ReleaseTestStackProps) {
                super(scope, id, props);

                const permissionsBoundary = iam.ManagedPolicy.fromManagedPolicyArn(
                        this,
                        'permissionsBoundary',
                        `arn:aws:iam::${props.env?.account}:policy/ci-permissions-boundary`
                )
                iam.PermissionsBoundary.of(this).apply(permissionsBoundary)

                // Create an ECR repository.
                const ecrRepo = new ecr.Repository(this, "ecr", { imageScanOnPush: true })

                // Copy from the Github source into ECR.
                new ecrdeploy.ECRDeployment(this, 'copyFromGithubToECR', {
                        src: new ecrdeploy.DockerImageName(`ghcr.io/${props.repoOwner}/${props.repoName}:${props.version}`),
                        dest: new ecrdeploy.DockerImageName(ecrRepo.repositoryUriForTag(props.version)),
                });
        }
}
