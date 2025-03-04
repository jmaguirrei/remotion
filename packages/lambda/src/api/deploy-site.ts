import type {WebpackOverrideFn} from 'remotion';
import {lambdaDeleteFile, lambdaLs} from '../functions/helpers/io';
import type {AwsRegion} from '../pricing/aws-regions';
import {bundleSite} from '../shared/bundle-site';
import {getSitesKey} from '../shared/constants';
import {getAccountId} from '../shared/get-account-id';
import {getS3DiffOperations} from '../shared/get-s3-operations';
import {makeS3ServeUrl} from '../shared/make-s3-url';
import {randomHash} from '../shared/random-hash';
import {validateAwsRegion} from '../shared/validate-aws-region';
import {validateBucketName} from '../shared/validate-bucketname';
import {validateSiteName} from '../shared/validate-site-name';
import {bucketExistsInRegion} from './bucket-exists';
import {enableS3Website} from './enable-s3-website';
import type {UploadDirProgress} from './upload-dir';
import {uploadDir} from './upload-dir';

export type DeploySiteInput = {
	entryPoint: string;
	bucketName: string;
	region: AwsRegion;
	siteName?: string;
	options?: {
		onBundleProgress?: (progress: number) => void;
		onUploadProgress?: (upload: UploadDirProgress) => void;
		webpackOverride?: WebpackOverrideFn;
		enableCaching?: boolean;
		publicDir?: string | null;
		rootDir?: string;
	};
};

export type DeploySiteOutput = Promise<{
	serveUrl: string;
	siteName: string;
	stats: {
		uploadedFiles: number;
		deletedFiles: number;
		untouchedFiles: number;
	};
}>;

/**
 * @description Deploys a Remotion project to an S3 bucket to prepare it for rendering on AWS Lambda.
 * @link https://remotion.dev/docs/lambda/deploysite
 * @param {AwsRegion} params.region The region in which the S3 bucket resides in.
 * @param {string} params.entryPoint An absolute path to the entry file of your Remotion project.
 * @param {string} params.bucketName The name of the bucket to deploy your project into.
 * @param {string} params.siteName The name of the folder in which the project gets deployed to.
 * @param {object} params.options Further options, see documentation page for this function.
 */
export const deploySite = async ({
	bucketName,
	entryPoint,
	siteName,
	options,
	region,
}: DeploySiteInput): DeploySiteOutput => {
	validateAwsRegion(region);
	validateBucketName(bucketName, {mustStartWithRemotion: true});

	const siteId = siteName ?? randomHash();
	validateSiteName(siteId);

	const accountId = await getAccountId({region});

	const bucketExists = await bucketExistsInRegion({
		bucketName,
		region,
		expectedBucketOwner: accountId,
	});
	if (!bucketExists) {
		throw new Error(`No bucket with the name ${bucketName} exists`);
	}

	const subFolder = getSitesKey(siteId);

	const [files, bundled] = await Promise.all([
		lambdaLs({
			bucketName,
			expectedBucketOwner: accountId,
			region,
			prefix: subFolder,
		}),
		bundleSite(entryPoint, options?.onBundleProgress ?? (() => undefined), {
			publicPath: `/${subFolder}/`,
			webpackOverride: options?.webpackOverride ?? ((f) => f),
			enableCaching: options?.enableCaching ?? true,
			publicDir: options?.publicDir,
			rootDir: options?.rootDir,
		}),
	]);

	const {toDelete, toUpload, existingCount} = await getS3DiffOperations({
		objects: files,
		bundle: bundled,
		prefix: subFolder,
	});

	await Promise.all([
		uploadDir({
			bucket: bucketName,
			region,
			localDir: bundled,
			onProgress: options?.onUploadProgress ?? (() => undefined),
			keyPrefix: subFolder,
			privacy: 'public',
			toUpload,
		}),
		Promise.all(
			toDelete.map((d) => {
				return lambdaDeleteFile({
					bucketName,
					customCredentials: null,
					key: d.Key as string,
					region,
				});
			})
		),
		enableS3Website({
			region,
			bucketName,
		}),
	]);

	return {
		serveUrl: makeS3ServeUrl({bucketName, subFolder, region}),
		siteName: siteId,
		stats: {
			uploadedFiles: toUpload.length,
			deletedFiles: toDelete.length,
			untouchedFiles: existingCount,
		},
	};
};
