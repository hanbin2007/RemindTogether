import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("<Home />", () => {
  it("renders the project hero title", () => {
    render(<Home />);
    expect(screen.getByTestId("hero-title")).toHaveTextContent("RemindTogether");
  });

  it("renders the encouraging tagline", () => {
    render(<Home />);
    expect(screen.getByTestId("hero-subtitle")).toHaveTextContent(
      /鼓励而非催促/,
    );
  });
});
