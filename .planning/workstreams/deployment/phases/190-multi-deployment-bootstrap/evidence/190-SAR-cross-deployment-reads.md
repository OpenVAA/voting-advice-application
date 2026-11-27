# 190 — The thirteen cross-deployment plan-role reads against the Service Authorization Reference

Read 2026-11-27 at top level, in the operator's session (VERIFICATION human item 3, INFRA-23). Phase 190-06 could not reach the AWS reference pages, so `infra/README.md` § Accepted risks lists all thirteen reads as unconfirmed. Source: the machine-readable Service Authorization Reference, `https://servicereference.us-east-1.amazonaws.com/v1/<service>/<service>.json` for cloudfront, elasticloadbalancing, ssm and ecs, fetched 2026-11-27. Per action: the resource types it can be scoped to (`*` when none) and the condition keys of the action and of each resource type.

```
cloudfront:GetDistribution resources=['distribution'] action_keys=[] resource_keys={'distribution': ['aws:ResourceTag/${TagKey}']}
cloudfront:GetDistributionConfig resources=['distribution'] action_keys=[] resource_keys={'distribution': ['aws:ResourceTag/${TagKey}']}
elasticloadbalancing:DescribeLoadBalancers resources=* action_keys=[] resource_keys={}
elasticloadbalancing:DescribeListeners resources=* action_keys=[] resource_keys={}
elasticloadbalancing:DescribeRules resources=* action_keys=[] resource_keys={}
elasticloadbalancing:DescribeTargetGroups resources=* action_keys=[] resource_keys={}
elasticloadbalancing:DescribeLoadBalancerAttributes resources=* action_keys=[] resource_keys={}
elasticloadbalancing:DescribeTags resources=* action_keys=[] resource_keys={}
ssm:GetParameter resources=['parameter'] action_keys=['aws:ResourceTag/${TagKey}'] resource_keys={'parameter': ['aws:ResourceTag/${TagKey}', 'ssm:resourceTag/tag-key']}
ssm:GetParameters resources=['parameter'] action_keys=['aws:ResourceTag/${TagKey}'] resource_keys={'parameter': ['aws:ResourceTag/${TagKey}', 'ssm:resourceTag/tag-key']}
ssm:GetParametersByPath resources=['parameter'] action_keys=['ssm:Recursive'] resource_keys={'parameter': ['aws:ResourceTag/${TagKey}', 'ssm:resourceTag/tag-key']}
ecs:DescribeServices resources=['service'] action_keys=['aws:ResourceTag/${TagKey}', 'ecs:cluster'] resource_keys={'service': ['aws:ResourceTag/${TagKey}', 'ecs:ResourceTag/${TagKey}']}
ecs:DescribeTaskDefinition resources=* action_keys=[] resource_keys={}
```

## Verdict

```
SAR_SCOPABLE=cloudfront:GetDistribution cloudfront:GetDistributionConfig ssm:GetParameter ssm:GetParameters ssm:GetParametersByPath ecs:DescribeServices
SAR_NOT_SCOPABLE=elasticloadbalancing:DescribeLoadBalancers elasticloadbalancing:DescribeListeners elasticloadbalancing:DescribeRules elasticloadbalancing:DescribeTargetGroups elasticloadbalancing:DescribeLoadBalancerAttributes elasticloadbalancing:DescribeTags ecs:DescribeTaskDefinition
SAR_SCOPABLE_COUNT=6
SAR_NOT_SCOPABLE_COUNT=7
```

The seven are resource-`*` actions with no condition key, so IAM cannot keep them to one deployment, and they stay accepted risks. The six can be narrowed. They include the CloudFront distribution configuration, which holds the origin-secret header.

## The live resources the six would be scoped by

Read-only, with the operator's SSO session (AdministratorAccess) on account 471112560111, eu-north-1:

```
CF distribution E3V7BYRXOVAFII Environment=staging
CF distribution E35AB5T1B38HA1 Environment=<none>   (not an OpenVAA deployment's)
CF distribution E3J0X0FHR0FCU7 Environment=<none>   (not an OpenVAA deployment's)
SSM /openvaa/staging/frontend/* (5 parameters, all SecureString) Environment=staging
ECS service/openvaa-staging/openvaa-staging-frontend Environment=staging
```

So a deny scoped to the deployment's own key would hold staging's reads:
- CloudFront: `aws:ResourceTag/Environment` not equal to the key. Distribution ARNs carry no name.
- SSM: `NotResource` of the own path `parameter/openvaa/<key>/*`. `GetParametersByPath` is evaluated against the path, which carries no tag.
- ECS `DescribeServices`: `NotResource` of `service/openvaa-<key>/*`.

The plan role's own reads would be untouched: its distribution is tagged with its key, and its parameters and service are named by it. The other two distributions in the account would also become unreadable to the plan roles, which none of them needs.
