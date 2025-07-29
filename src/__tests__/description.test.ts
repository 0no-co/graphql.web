import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { print } from '../printer';
import type {
  OperationDefinitionNode,
  VariableDefinitionNode,
  FragmentDefinitionNode,
} from '../ast';

describe('GraphQL descriptions', () => {
  describe('OperationDefinition descriptions', () => {
    it('parses operation with description', () => {
      const source = `
        """
        Request the current status of a time machine and its operator.
        """
        query GetTimeMachineStatus {
          timeMachine {
            id
            status
          }
        }
      `;

      const doc = parse(source, { noLocation: true });
      const operation = doc.definitions[0] as OperationDefinitionNode;

      expect(operation.description).toBeDefined();
      expect(operation.description?.value).toBe(
        'Request the current status of a time machine and its operator.'
      );
      expect(operation.description?.block).toBe(true);
    });

    it('parses operation with single-line description', () => {
      const source = `
        "Simple query description"
        query SimpleQuery {
          field
        }
      `;

      const doc = parse(source, { noLocation: true });
      const operation = doc.definitions[0] as OperationDefinitionNode;

      expect(operation.description).toBeDefined();
      expect(operation.description?.value).toBe('Simple query description');
      expect(operation.description?.block).toBe(false);
    });

    it('does not allow description on anonymous operations', () => {
      const source = `
        "This should fail"
        {
          field
        }
      `;

      expect(() => parse(source)).toThrow();
    });

    it('parses mutation with description', () => {
      const source = `
        """
        Create a new time machine entry.
        """
        mutation CreateTimeMachine($input: TimeMachineInput!) {
          createTimeMachine(input: $input) {
            id
          }
        }
      `;

      const doc = parse(source, { noLocation: true });
      const operation = doc.definitions[0] as OperationDefinitionNode;

      expect(operation.description).toBeDefined();
      expect(operation.description?.value).toBe('Create a new time machine entry.');
    });
  });

  describe('VariableDefinition descriptions', () => {
    it('parses variable with description', () => {
      const source = `
        query GetTimeMachineStatus(
          "The unique serial number of the time machine to inspect."
          $machineId: ID!
          
          """
          The year to check the status for.
          **Warning:** certain years may trigger an anomaly in the space-time continuum.
          """
          $year: Int
        ) {
          timeMachine(id: $machineId) {
            status(year: $year)
          }
        }
      `;

      const doc = parse(source, { noLocation: true });
      const operation = doc.definitions[0] as OperationDefinitionNode;
      const variables = operation.variableDefinitions as VariableDefinitionNode[];

      expect(variables[0].description).toBeDefined();
      expect(variables[0].description?.value).toBe(
        'The unique serial number of the time machine to inspect.'
      );
      expect(variables[0].description?.block).toBe(false);

      expect(variables[1].description).toBeDefined();
      expect(variables[1].description?.value).toBe(
        'The year to check the status for.\n**Warning:** certain years may trigger an anomaly in the space-time continuum.'
      );
      expect(variables[1].description?.block).toBe(true);
    });

    it('parses mixed variables with and without descriptions', () => {
      const source = `
        query Mixed(
          "Described variable"
          $described: String
          $undescribed: Int
        ) {
          field
        }
      `;

      const doc = parse(source, { noLocation: true });
      const operation = doc.definitions[0] as OperationDefinitionNode;
      const variables = operation.variableDefinitions as VariableDefinitionNode[];

      expect(variables[0].description).toBeDefined();
      expect(variables[0].description?.value).toBe('Described variable');
      expect(variables[1].description).toBeUndefined();
    });
  });

  describe('FragmentDefinition descriptions', () => {
    it('parses fragment with description', () => {
      const source = `
        "Time machine details."
        fragment TimeMachineDetails on TimeMachine {
          id
          model
          lastMaintenance
        }
      `;

      const doc = parse(source, { noLocation: true });
      const fragment = doc.definitions[0] as FragmentDefinitionNode;

      expect(fragment.description).toBeDefined();
      expect(fragment.description?.value).toBe('Time machine details.');
      expect(fragment.description?.block).toBe(false);
    });

    it('parses fragment with block description', () => {
      const source = `
        """
        Comprehensive time machine information
        including maintenance history and operational status.
        """
        fragment FullTimeMachineInfo on TimeMachine {
          id
          model
          lastMaintenance
          operationalStatus
        }
      `;

      const doc = parse(source, { noLocation: true });
      const fragment = doc.definitions[0] as FragmentDefinitionNode;

      expect(fragment.description).toBeDefined();
      expect(fragment.description?.value).toBe(
        'Comprehensive time machine information\nincluding maintenance history and operational status.'
      );
      expect(fragment.description?.block).toBe(true);
    });
  });

  describe('print with descriptions', () => {
    it('prints operation description correctly', () => {
      const source = `"""
Request the current status of a time machine and its operator.
"""
query GetTimeMachineStatus {
  timeMachine {
    id
  }
}`;

      const doc = parse(source, { noLocation: true });
      const printed = print(doc);

      expect(printed).toContain('"""');
      expect(printed).toContain('Request the current status of a time machine and its operator.');
    });

    it('prints variable descriptions correctly', () => {
      const source = `query GetStatus(
  "Machine ID"
  $id: ID!
) {
  field
}`;

      const doc = parse(source, { noLocation: true });
      const printed = print(doc);

      expect(printed).toContain('"Machine ID"');
    });

    it('prints fragment description correctly', () => {
      const source = `"Details fragment"
fragment Details on Type {
  field
}`;

      const doc = parse(source, { noLocation: true });
      const printed = print(doc);

      expect(printed).toContain('"Details fragment"');
    });
  });

  describe('roundtrip parsing and printing', () => {
    it('maintains descriptions through parse and print cycle', () => {
      const source = `"""
Request the current status of a time machine and its operator.
"""
query GetTimeMachineStatus(
  "The unique serial number of the time machine to inspect."
  $machineId: ID!

  """
  The year to check the status for.
  **Warning:** certain years may trigger an anomaly in the space-time continuum.
  """
  $year: Int
) {
  timeMachine(id: $machineId) {
    ...TimeMachineDetails
    operator {
      name
      licenseLevel
    }
    status(year: $year)
  }
}

"Time machine details."
fragment TimeMachineDetails on TimeMachine {
  id
  model
  lastMaintenance
}`;

      const doc = parse(source, { noLocation: true });
      const printed = print(doc);
      const reparsed = parse(printed, { noLocation: true });

      const operation = doc.definitions[0] as OperationDefinitionNode;
      const reparsedOperation = reparsed.definitions[0] as OperationDefinitionNode;

      // The printed/reparsed cycle may have slightly different formatting but same content
      expect(reparsedOperation.description?.value?.trim()).toBe(
        operation.description?.value?.trim()
      );

      const fragment = doc.definitions[1] as FragmentDefinitionNode;
      const reparsedFragment = reparsed.definitions[1] as FragmentDefinitionNode;

      expect(reparsedFragment.description?.value).toBe(fragment.description?.value);
    });
  });
});
