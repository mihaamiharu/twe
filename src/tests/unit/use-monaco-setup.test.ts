import { describe, expect, test } from 'bun:test';
import { createMonacoAdapter } from '@/components/challenges/editor/use-monaco-setup';

function createDefaults() {
  return {
    setCompilerOptions: () => {},
    setDiagnosticsOptions: () => {},
    addExtraLib: () => ({ dispose: () => {} }),
  };
}

describe('createMonacoAdapter', () => {
  test('accepts Monaco KeyMod when it is exposed as a callable class', () => {
    class KeyMod {
      static readonly CtrlCmd = 2048;
    }

    const adapter = createMonacoAdapter({
      editor: {
        setTheme: () => {},
        defineTheme: () => {},
      },
      typescript: {
        typescriptDefaults: createDefaults(),
        javascriptDefaults: createDefaults(),
        ScriptTarget: { ESNext: 99 },
        ModuleKind: { ESNext: 99 },
        ModuleResolutionKind: { NodeJs: 2 },
      },
      KeyMod,
      KeyCode: { Enter: 3, KeyS: 49 },
    });

    expect(adapter.KeyMod.CtrlCmd).toBe(2048);
  });
});
