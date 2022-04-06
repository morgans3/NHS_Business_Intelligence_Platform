/// <reference types="cypress" />

import { _MYDOMAIN } from "../../../lib/_config";

describe("Test Dashboard", () => {
  before(() => {
    cy.fixture("users").then((user) => {
      cy.niLogin(user, "www." + _MYDOMAIN);
      cy.url().should("include", "dashboard");
    });
  });

  it("check the carousel loads", () => {
    cy.get("app-nexusintelcarousel").should("be.visible");
  });

  it("check the population health dashboard loads", () => {
    cy.get("app-population").should("be.visible");
    // TODO: test mini CF filter functions works
  });

  it("check the twitter newsfeed loads", () => {
    cy.get("app-dashboard-twitter").should("be.visible");
  });
});
