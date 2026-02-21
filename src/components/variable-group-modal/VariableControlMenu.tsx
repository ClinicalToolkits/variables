// components/VariableControlMenu.tsx
import React, { useMemo, useState } from "react";
import { Anchor, Checkbox, Stack, rem } from "@mantine/core";
import { textStyles } from "@clinicaltoolkits/universal-react-components";
import { VariableControl } from "../../types";
import { VariableControlId } from "../../state/VariableControlStore";

export interface VariableControlMenuProps {
  controls: readonly VariableControl[];
  getControlState: (controlId: VariableControlId) => boolean;
  onChange: (controlId: VariableControlId, nextOn: boolean) => void;
}

/**
 * Minimal menu that renders checkboxes for the given controls.
 * - Assumes each control exposes its current state (e.g., control.isOn()).
 * - Emits onChange(control, nextOn) on toggle.
 * - Shows the first item, with a "Show more / Hide options" toggle if there are multiple.
 */
export const VariableControlMenu = ({
  controls,
  getControlState,
  onChange,
}: VariableControlMenuProps): JSX.Element | null => {
  if (!controls?.length) return null;

  const [collapsed, setCollapsed] = useState(true);

  const list = useMemo(() => {
    // Stable label-based sort; fall back to id when needed
    return [...controls].sort((a, b) => {
      const la = (a.getDisplayNameLong?.() ?? a.getId?.() ?? "").toString();
      const lb = (b.getDisplayNameLong?.() ?? b.getId?.() ?? "").toString();
      return la.localeCompare(lb);
    });
  }, [controls]);

  const visibleControls = collapsed ? list.slice(0, 1) : list;

  return (
    <Stack gap={rem("5px")}>
      {visibleControls.map((control) => {
        const id = control.getId();
        const label = control.getDisplayNameLong();
        const checked = getControlState(id);

        return (
          <Checkbox
            key={id}
            id={`vc-${id}`}
            label={label}
            checked={checked}
            onChange={() => onChange(id, !checked)}
            size="xs"
            classNames={{ label: textStyles.generalText }}
          />
        );
      })}

      {list.length > 1 && (
        <Anchor onClick={() => setCollapsed((v) => !v)} size="xs">
          {collapsed ? "Show more options" : "Hide options"}
        </Anchor>
      )}
    </Stack>
  );
}
