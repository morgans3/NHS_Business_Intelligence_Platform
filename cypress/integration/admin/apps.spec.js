/// <reference types="cypress" />

import { _MYDOMAIN } from "../../../lib/_config";

describe("Test Admin", () => {
  before(() => {
    cy.fixture("users").then((user) => {
      cy.niLogin(user, "www." + _MYDOMAIN);
      cy.url().should("include", "dashboard");
      // TODO: navigate to Admin
    });
  });

  it("check the carousel loads", () => {
    cy.get("app-nexusintelcarousel").should("be.visible");
  });

  // TODO: check all CRUD functions, tidy up resources at end of test
});
