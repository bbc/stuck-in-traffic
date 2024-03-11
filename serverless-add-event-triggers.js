const { join, defaultTo, toString } = require('ramda')

const createEventTriggers = () => {
  // aggregateEventTriggers :: [{aggregateEventTrigger}]
  //
  // Properties of {aggregateEventTrigger}
  // ═══════════════════╤═════════╤═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  //  property          │  Type   │ Description
  // ═══════════════════╪═════════╪═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
  // aggregateId        │ String  │ unique string with distinct hierarchical sections, separated by 'ꂓ' - represents a specific set (1-N) of scenes,
  //                    │         │ but aggregateId does not have to be unique in this list, i.e. {aggregateEventTrigger} with duplicate Ids can
  //                    │         │ be used to create more complex event patterns, i.e. every 15 min but also every 1 min around midnight, or
  //                    │         │ every 5 min during the day and every 30 min during the night
  // ───────────────────┼─────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ScheduleExpression │ String  │ string, denoting trigger frequency, as defined by AWS::Events::Rule, default is: 'rate(1 minute)'
  //                    │         │ also can include cron format, e.g. 'cron(01-05 0 * * ? *)'
  // ───────────────────┴─────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  // The monitoring threshold for the PublishingStalled alarm is determined by the invocation rates set by the triggers that are enabled on live.
  // So if you change these intervals or add new aggregateIds you also need to change the monitoring threshold in the serverless.yml
  // Currently the expected number of updates per 5 minutes is: 2
  const aggregateEventTriggers = {
    int: [
      {
        aggregateId: 'stuckꂓinꂓtraffic',
        ScheduleExpression: 'cron(0 8 * * ? *)',
      },
    ],
    test: [],
    live: [],
  }

  // eslint-disable-next-line no-undef
  const resources =
    serverless.service.provider.compiledCloudFormationTemplate.Resources
  const { stage, accountId } = serverless.service.custom

  // incrementing counter, used in pair of resources' Ids - event schedule rule and corresponding permission
  let resourceEventCount = 0

  // generate event and lambda permission for the event, for each trigger
  aggregateEventTriggers[stage].forEach((aggregateEventTrigger) => {
    const aggregateId = aggregateEventTrigger.aggregateId
    const ScheduleExpression = defaultTo(
      'rate(1 minute)',
      aggregateEventTrigger.ScheduleExpression
    )

    resourceEventCount = resourceEventCount + 1
    const resourceEventCountPad = toString(resourceEventCount).padStart(3, '0')

    // add events
    const eventLogicalID = `E${resourceEventCountPad}`
    resources[eventLogicalID] = {
      Type: 'AWS::Events::Rule',
      Properties: {
        ScheduleExpression,
        Description: join(' | ', [aggregateId, ScheduleExpression]),
        State: 'ENABLED',
        Name: aggregateId.aggregateEventTrigger,
        Targets: [
          {
            Arn: {
              'Fn::GetAtt': ['AggregateLambdaFunction', 'Arn'],
            },
            Id: eventLogicalID,
            Input: JSON.stringify({ aggregateId }),
          },
        ],
      },
    }
  })

  // add permissions for events
  resources['BRBStuckInTrafficEventsPermission'] = {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      FunctionName: {
        'Fn::GetAtt': ['AggregateLambdaFunction', 'Arn'],
      },
      Action: 'lambda:InvokeFunction',
      Principal: {
        'Fn::Join': [
          '',
          [
            'events.',
            {
              Ref: 'AWS::URLSuffix',
            },
          ],
        ],
      },
      SourceArn: `arn:aws:events:eu-west-1:${accountId}:rule/${stage}-stuck-in-traffic-${stage}-*`,
    },
  }
}

createEventTriggers()
