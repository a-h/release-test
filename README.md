# Release strategy

## Principles

* Three environments - testing, staging, production.
* CI/CD - a successful run results in an automated push to testing.
* Braindead YAML.
* Use shell scripts to help keep the YAML simple.
* Should be able to run it yourself without Github Actions, no magic.
* Linux only, Mac/Windows must use Docker.
* Put all the dependencies in the build Docker, don't mess about with the Github environment.
  * Except for setting the VERSION:
  * `. ./version.sh`
* Always have CI commands run from the root directory.

## Process

On Push to main:
  * Install dependencies `./install.sh`
      * Run `go get` or `npm install`
  * Run linting rules `./lint.sh`
      * Run `gosec`, SonarQube etc.
  * Run unit tests `./test.sh`
      * Run `go test ./...` or `npm test`
  * Create version `. ./version.sh`
      * ``export VERSION=v1.0.`git rev-list --count HEAD`;``
  * Tag `./tag.sh`
      * `git tag ${VERSION}; && git push origin ${VERSION};`
  * Build `./build.sh`
      * The `build.sh` script might want to make use of the `VERSION` environment variable.
      * Lambda:
        * Go - create binaries for each handler with `go build` and output to `packages/handlers/xxxx`
	* Node.js - run `esbuild` against each directory, and output to `packages/handlers/xxxx`
      * Docker
        * Run `docker build` and push to Github packages.
      * CDK
        * Create a Docker project for CDK.
	* Copy in the contents of the `cdk` directory and the `package/handlers/xxxx` to stop CDK from rebuilding Lambda functions.
	* In the CDK, copy Docker images from Github to ECR using cdk-ecr-deployment instead of using `DockerImageAsset`.
	  * https://github.com/aws/aws-cdk/issues/12597
	  * https://github.com/cdklabs/cdk-ecr-deployment
	* Copy in the source code as a backup, but not in the same directory tree, so that CDK can't use bundlers to build the code again e.g. `awslambdago`.
	* Make the `entrypoint.sh` in Docker run `cdk deploy`.
  * Release `./release.sh`
      * Create a Github release - `https://cli.github.com/manual/gh_release_create`
  * Deploy (to testing) `./deploy.sh`
      * Assume role in the testing account.
      * Run the CDK Docker that was just created.
      * AWS will need a Github token to copy Docker images from Github Packages (ghcr,io) to ECR. It will need to be created in AWS Secrets Manager and passed in as `GITHUB_SECRET_ARN`.

### To deploy to staging / production

Staging and production branches contain just a Github workflow and a `deploy.sh` file which deploys using the CDK Docker container.

Developers update the `deploy.sh` file to update the version number that gets deployed.

The Github workflow:

* Assumes a role in the appropriate account (i.e. a deployment role in the staging account, if this is the staging branch).
* Runs `./deploy.sh`, passing in any values from Github secrets. It's the job of the CDK project to throw an error if environment variables are missing.

