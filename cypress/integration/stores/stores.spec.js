/// <reference types="cypress" />

import { _MYDOMAIN } from "../../../lib/_config";

describe("Test Stores", () => {
  before(() => {
    cy.fixture("users").then((user) => {
      cy.niLogin(user, "www." + _MYDOMAIN);
      cy.url().should("include", "dashboard");
      // TODO: navigate to Stores (plural)
    });
  });

  it("check the carousel loads", () => {
    cy.get("app-nexusintelcarousel").should("be.visible");
  });

  // TODO: check apps display, cann install, can open app + dashboards
});
