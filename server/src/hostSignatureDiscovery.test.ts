import test from 'node:test';
import assert from 'node:assert/strict';

import { discoverHostSignaturesFromTypeLibrary } from './hostSignatureDiscovery';

test('HostSignatureDiscovery reads Type Library metadata into HostDefinitions', async () => {
  let captured_script = '';
  const definitions = await discoverHostSignaturesFromTypeLibrary('excel', async (script) => {
    captured_script = script;
    return JSON.stringify([
      {
        name: 'Range',
        kind: 'class',
        members: [
          {
            name: 'Find',
            kind: 'function',
            typeName: 'Range',
            signature: {
              label: 'Find(What) As Range',
              returnTypeName: 'Range',
              parameters: [
                {
                  name: 'What',
                  typeName: 'Variant',
                  documentation: 'The data to search for.'
                }
              ]
            }
          }
        ]
      }
    ]);
  });

  assert.match(captured_script, /LoadRegTypeLib/);
  assert.match(captured_script, /\{00020813-0000-0000-C000-000000000046\}/);
  assert.match(captured_script, /NumberStyles\.HexNumber/);
  assert.match(captured_script, /IsInfrastructureMember/);
  assert.match(captured_script, /INVOKE_PROPERTYPUTREF/);
  assert.match(captured_script, /lpVarValue/);
  assert.match(captured_script, /catch \(ArgumentException\)/);
  assert.match(captured_script, /unchecked\(\(int\)typeDesc\.lpValue\.ToInt64\(\)\)/);
  assert.doesNotMatch(captured_script, /PARAMDESCEX/);
  assert.deepEqual(definitions, [
    {
      name: 'Range',
      kind: 'class',
      hostApplication: 'excel',
      members: [
        {
          name: 'Find',
          kind: 'function',
          hostApplication: 'excel',
          typeName: 'Range',
          signature: {
            label: 'Find(What) As Range',
            returnTypeName: 'Range',
            parameters: [
              {
                name: 'What',
                typeName: 'Variant',
                documentation: 'The data to search for.'
              }
            ]
          }
        }
      ]
    }
  ]);
});

test('HostSignatureDiscovery treats PowerShell null DTO properties as missing metadata', async () => {
  const definitions = await discoverHostSignaturesFromTypeLibrary('excel', async () =>
    JSON.stringify([
      {
        name: 'Range',
        kind: 'class',
        documentation: null,
        typeName: null,
        signature: null,
        members: [
          {
            name: 'Find',
            kind: 'function',
            documentation: null,
            typeName: 'Range',
            signature: {
              label: 'Find(What) As Range',
              parameters: [
                {
                  name: 'What',
                  label: 'What',
                  documentation: null,
                  optional: null,
                  passingMode: null,
                  isParamArray: null,
                  typeName: 'Variant',
                  defaultValue: null
                }
              ],
              returnTypeName: 'Range',
              documentation: null
            },
            members: null
          }
        ]
      }
    ])
  );

  assert.deepEqual(definitions, [
    {
      name: 'Range',
      kind: 'class',
      hostApplication: 'excel',
      members: [
        {
          name: 'Find',
          kind: 'function',
          hostApplication: 'excel',
          typeName: 'Range',
          signature: {
            label: 'Find(What) As Range',
            parameters: [
              {
                name: 'What',
                label: 'What',
                typeName: 'Variant'
              }
            ],
            returnTypeName: 'Range'
          }
        }
      ]
    }
  ]);
});
