import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders the provided label", () => {
    render(<Button type="button">投稿する</Button>);

    expect(
      screen.getByRole("button", { name: "投稿する" }),
    ).toBeInTheDocument();
  });
});
