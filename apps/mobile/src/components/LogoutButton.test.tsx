import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, screen, act } from "@testing-library/react";
import { useClerk } from "@clerk/clerk-expo";

const mockSignOut = vi.fn().mockResolvedValue(undefined);

vi.mock("@clerk/clerk-expo", () => ({
  useClerk: vi.fn(() => ({ signOut: mockSignOut })),
}));

// Mock react-native with DOM-friendly components so onPress works as onClick
vi.mock("react-native", () => {
  const React = require("react");
  const TouchableOpacity = (props: Record<string, unknown>) => {
    const {
      onPress,
      activeOpacity,
      accessibilityRole,
      accessibilityLabel,
      accessibilityState,
      ...rest
    } = props;
    return React.createElement("button", {
      type: "button",
      onClick: onPress,
      "aria-label": accessibilityLabel,
      ...rest,
    }, props.children);
  };
  return {
    View: (p: Record<string, unknown>) => React.createElement("div", p, p.children),
    Text: (p: Record<string, unknown>) => React.createElement("span", p, p.children),
    TouchableOpacity,
    ActivityIndicator: () => React.createElement("span", {}, "Loading..."),
    StyleSheet: { create: (s: Record<string, unknown>) => s },
  };
});

import { LogoutButton } from "./LogoutButton";

describe("LogoutButton", () => {
  beforeEach(() => {
    mockSignOut.mockClear();
    vi.mocked(useClerk).mockReturnValue({ signOut: mockSignOut } as ReturnType<typeof useClerk>);
  });

  it("renders Log Out text", () => {
    render(<LogoutButton />);
    expect(screen.getByText("Log Out")).toBeTruthy();
  });

  it("calls signOut when pressed", async () => {
    render(<LogoutButton />);
    await act(async () => {
      fireEvent.click(screen.getByText("Log Out"));
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("has accessibility attributes for screen readers", () => {
    const { container } = render(<LogoutButton />);
    const button = container.querySelector('[aria-label="Log out"]');
    expect(button).toBeTruthy();
  });
});
