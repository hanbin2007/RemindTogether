import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("<Home />", () => {
  it("renders the project hero with encouraging tagline", () => {
    render(<Home />);
    expect(screen.getByTestId("hero-tagline")).toHaveTextContent(
      /REMIND.*TOGETHER/,
    );
    expect(screen.getByTestId("hero-title")).toHaveTextContent(
      /鼓励.*而非催促/,
    );
  });

  it("renders both signup and login CTAs", () => {
    render(<Home />);
    expect(screen.getByTestId("cta-signup")).toHaveTextContent("创建账号");
    expect(screen.getByTestId("cta-login")).toHaveTextContent(/登录/);
  });

  it("renders the supportive subtitle", () => {
    render(<Home />);
    expect(screen.getByTestId("hero-subtitle")).toHaveTextContent(
      /互相打气/,
    );
  });
});
