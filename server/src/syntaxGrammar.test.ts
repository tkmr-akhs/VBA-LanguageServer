import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

interface GrammarPattern {
  name?: string;
  match?: string;
  begin?: string;
  patterns?: GrammarPattern[];
}

interface TextMateGrammar {
  scopeName: string;
  patterns: GrammarPattern[];
  repository?: Record<string, GrammarPattern>;
}

test('extension contributes a VBA TextMate grammar for the vba language', () => {
  const package_json = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  ) as {
    contributes?: {
      grammars?: Array<{
        language?: string;
        scopeName?: string;
        path?: string;
      }>;
    };
  };

  assert.deepEqual(package_json.contributes?.grammars, [
    {
      language: 'vba',
      scopeName: 'source.vba',
      path: './syntaxes/vba.tmLanguage.json'
    }
  ]);
});

test('VBA TextMate grammar has lexical scopes for representative VBA fixtures', () => {
  const grammar = readGrammar();
  const patterns = flattenPatterns(grammar);

  assert.equal(grammar.scopeName, 'source.vba');
  assertPatternMatches(patterns, 'comment.block.documentation.vba', "'* @brief Reads a value.");
  assertPatternMatches(patterns, 'comment.line.apostrophe.vba', "' ordinary comment");
  assertPatternMatches(patterns, 'string.quoted.double.vba', '"a ""quoted"" value"');
  assertPatternMatches(patterns, 'keyword.control.vba', 'Public Function BuildValue() As String');
  assertPatternMatches(patterns, 'storage.type.intrinsic.vba', 'Dim value As String');
  assertPatternMatches(patterns, 'constant.language.vba', 'Set target = Nothing');
  assertPatternMatches(patterns, 'constant.numeric.vba', 'value = &HFF');
  assertPatternMatches(patterns, 'keyword.operator.vba', 'If left_value <> right_value Then');
  assertPatternMatches(patterns, 'meta.attribute.vba', 'Attribute VB_Name = "Module1"');
});

function readGrammar(): TextMateGrammar {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'syntaxes', 'vba.tmLanguage.json'), 'utf8')
  ) as TextMateGrammar;
}

function flattenPatterns(grammar: TextMateGrammar): GrammarPattern[] {
  const result: GrammarPattern[] = [];
  const visit = (pattern: GrammarPattern): void => {
    result.push(pattern);
    pattern.patterns?.forEach(visit);
  };

  grammar.patterns.forEach(visit);
  Object.values(grammar.repository ?? {}).forEach(visit);
  return result;
}

function assertPatternMatches(patterns: GrammarPattern[], scopeName: string, fixture: string): void {
  const pattern = patterns.find((candidate) => candidate.name === scopeName);
  assert.ok(pattern, `Expected grammar scope ${scopeName}`);

  const expression = pattern.match ?? pattern.begin;
  assert.ok(expression, `Expected grammar scope ${scopeName} to have a match or begin pattern`);
  assert.match(fixture, new RegExp(expression));
}
