---
image: /generated/articles-docs-lambda-permissions.png
sidebar_label: Permissions
title: Permissions
crumb: "Lambda"
---

import {UserPolicy} from '../../components/lambda/user-permissions.tsx';
import {RolePolicy} from '../../components/lambda/role-permissions.tsx';

This document describes the necessary permissions for Remotion Lambda and explains to those interested why the permissions are necessary.

For a step by step guide on how to set up permissions, [follow the setup guide](/docs/lambda/setup).

## User permissions

This policy should be assigned to the **AWS user**. To do so, go to the [AWS console](https://console.aws.amazon.com/console/home) ➞ [IAM](https://console.aws.amazon.com/iam/home) ➞ [Users](https://console.aws.amazon.com/iamv2/home#/users) ➞ Your created Remotion user ➞ Permissions tab ➞ Add inline policy ➞ JSON.

<details>
<summary>Show full user permissions JSON file for latest Remotion Lambda version
</summary>
<UserPolicy />
</details>

:::info
You can always get the suitable permission file for your Remotion Lambda version by typing `npx remotion lambda policies user`.
:::

## Role permissions

This policy should be assigned to the **role `remotion-lambda-role`** in your AWS account. The permissions below are given to the Lambda function itself.

To assign, go to [AWS console](https://console.aws.amazon.com/console/home) ➞ [IAM](https://console.aws.amazon.com/iam/home) ➞ [Roles](https://console.aws.amazon.com/iamv2/home#/roles) ➞ [`remotion-lambda-role`](https://console.aws.amazon.com/iam/home#/roles/remotion-lambda-role) ➞ Permissions tab ➞ [Add inline policy](https://console.aws.amazon.com/iam/home#/roles/remotion-lambda-role$createPolicy?step=edit).

<details>
<summary>Show full role permissions JSON file for latest Remotion Lambda version
  </summary>
  <RolePolicy />
</details>

:::info
You can always get the suitable permission file for your Remotion Lambda version by typing `npx remotion lambda policies role`.
:::

## Validation

There are two ways in which you can test if the permissions for the user have been correctly set up. Either you execute the following command:

```bash
npx remotion lambda policies validate
```

or if you want to validate it programmatically, using the [`simulatePermissions()`](/docs/lambda/simulatepermissions) function.

:::info
Policies for the role cannot be validated.
:::

## Explanation

The following table is a breakdown of why Remotion Lambda requires the permissions it does.

### User policies

<table>
  <tr>
    <th>
      Permission
    </th>
    <th>
      Scope
    </th>
    <th>
      Reason
    </th>
  </tr>
  <tr>
    <td>
      <code>iam:SimulatePrincipalPolicy</code>
    </td>
    <td><code>*</code></td>
    <td>
      Allows for <code>npx remotion lambda permissions validate</code>.
    </td>
  </tr>
  <tr>
    <td>
      <code>iam:PassRole</code>
    </td>
    <td><code>arn:aws:iam::*:role/remotion-lambda-role</code></td>
    <td>
    Allows the Lambda function to assume a role with sufficient permissions.
    </td>
  </tr>
  <tr>
    <td>
      <code>s3:GetObject</code> <br />
      <code>s3:DeleteObject</code> <br />
      <code>s3:PutObjectAcl</code> <br />
      <code>s3:PutObject</code> <br />
      <code>s3:CreateBucket</code> <br/>
      <code>s3:ListBucket</code> <br />
      <code>s3:GetBucketLocation</code> <br />
      <code>s3:PutBucketAcl</code> <br />
      <code>s3:DeleteBucket</code> <br />
      <code>s3:PutBucketWebsite</code> <br />
      <code>s3:DeleteBucketWebsite</code> <br />
    </td>
    <td>
      <code>{'arn:aws:s3:::remotionlambda-*'}</code>
    </td>
    <td>
      Allows to create and delete buckets and objects in your account, make objects public and configure them as websites. Only buckets that start with <code>remotionlambda-</code> can be accessed. 
    </td>
  </tr>
  <tr>
    <td>
      <code>s3:ListAllMyBuckets</code>
    </td>
    <td>
      <code>{'arn:aws:s3:::*'}</code>
    </td>
    <td>
      Allows listing the names of all buckets in your account, in order to detect an already existing Remotion bucket.
    </td>
  </tr>

  <tr>
    <td>
      <code>lambda:GetLayerVersion</code>
    </td>
    <td>
      <code>{"arn:aws:lambda:*:678892195805:layer:remotion-binaries-*"}</code>
    </td>
    <td>
    Allows to read Chromium and FFMPEG binaries. These binaries are hosted in an account hosted by Remotion specifically dedicated to hosting those layers in all supported regions.
    </td>
  </tr>
  <tr>
    <td>
      <code>lambda:ListFunctions</code> <br/>
      <code>lambda:GetFunction</code> <br/>
    </td>
    <td>
      <code>{"*"}</code>
    </td>
    <td>
    Allows to read the functions in your AWS account in order to find the correct function to invoke. The loose <code>*</code> permission is because AWS doesn't allow this permission to be tightened.
    </td>
  </tr>
  <tr>
    <td>
      <code>logs:InvokeAsync</code> <br/>
      <code>logs:InvokeFunction</code> <br/>
      <code>logs:DeleteFunction</code> <br/>
      <code>logs:PutFunctionEventInvokeConfig</code> <br/>
      <code>logs:CreateFunction</code> <br/>
    </td>
    <td>
      <code>{"arn:aws:lambda:*:*:function:remotion-render-*"}</code>
    </td>
    <td>
    Allows to create, delete, invoke and configure functions (such as disabling automatic retries). Used by the CLI and the Node.JS APIS to set up, execute and teardown the infrastructure.
    </td>
  </tr>
  <tr>
    <td>
      <code>logs:CreateLogGroup</code> <br/>
      <code>logs:PutRetentionPolicy</code>
    </td>
    <td>
      <code>{"arn:aws:logs:*:*:log-group:/aws/lambda/remotion-render-*"}</code>
    </td>
    <td>
    Allows to create CloudWatch group, so logs can be saved in there later. Simplifies debugging.
    </td>
  </tr>
  <tr>
    <td>
      <code>servicequotas:GetServiceQuota</code> <br/>
      <code>servicequotas:GetAWSDefaultServiceQuota</code> <br/>
      <code>servicequotas:RequestServiceQuotaIncrease</code> <br/>
      <code style={{wordBreak: 'break-all'}}>servicequotas:ListRequestedServiceQuotaChangeHistoryByQuota</code> <br/>
    </td>
    <td>
      <code>{"*"}</code>
    </td>
    <td>
    Powers the <code>lambda quotas</code> CLI command.
    </td>
  </tr>
</table>

### Role policies

<table>
  <tr>
    <th>
      Permission
    </th>
    <th>
      Scope
    </th>
    <th>
      Reason
    </th>
  </tr>
  <tr>
    <td>
      <code>s3.ListAllMyBuckets</code>
    </td>
    <td>
      <code>{"*"}</code>
    </td>
    <td>
    Get a list of Remotion buckets in order to find existing buckets that start with <code>remotionlambda-</code>.
    </td>
  </tr>
  <tr>
    <td>
      <code>s3:CreateBucket</code> <br/>
      <code>s3:ListBucket</code> <br/>
      <code>s3:PutBucketAcl</code> <br/>
      <code>s3:GetObject</code> <br/>
      <code>s3:DeleteObject</code> <br/>
      <code>s3:PutObjectAcl</code> <br/>
      <code>s3:PutObject</code> <br/>
      <code>s3:GetBucketLocation</code> 
    </td>
    <td>
      <code>{"arn:aws:s3:::remotionlambda-*"}</code>
    </td>
    <td>
  Create and delete buckets and items, make them public or private and fetch their location. Since Remotion stores the videos in an S3 bucket, it needs basic CRUD capabilities over those buckets. The permission only applies to buckets that start with <code>remotionlambda-</code>
    </td>
  </tr>
  <tr>
    <td>
      <code>lambda:InvokeFunction</code> <br/>
    </td>
    <td>
      <code>{"arn:aws:lambda:*:*:function:remotion-render*"}</code>
    </td>
    <td>
Allow the function to recursively invoke itself. A render involves multiple function calls, which is to be orchestrated by the first function call.
    </td>

  </tr>
  <tr>
    <td>
      <code>lambda:CreateLogStream</code> <br/>
      <code>lambda:PutLogEvents</code> <br/>
    </td>
    <td>
      <code>{"arn:aws:logs:*:*:log-group:/aws/lambda/remotion-render*"}</code>
    </td>
    <td>
Allows to write the function logs to CloudWatch for easier debugging.
    </td>

  </tr>
 
</table>

## See also

- [Set up guide](/docs/lambda/setup)
- [`simulatePermissions()`](/docs/lambda/simulatepermissions)
- [Permissions Troubleshooting](/docs/lambda/troubleshooting/permissions)
