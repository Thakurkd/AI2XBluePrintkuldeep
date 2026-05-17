package com.salesforce.tests;

import com.salesforce.pages.LoginPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.testng.Assert;
import org.testng.annotations.AfterTest;
import org.testng.annotations.BeforeTest;
import org.testng.annotations.Test;

import java.time.Duration;

public class InvalidLoginTest {
    private WebDriver driver;
    private LoginPage loginPage;

    @BeforeTest
    public void setUp() {
        try {
            driver = new ChromeDriver();
            driver.manage().window().maximize();
            driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(30));
            driver.get("https://login.salesforce.com/?locale=in");
            loginPage = new LoginPage(driver);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    public void testInvalidLogin() {
        try {
            loginPage.login("invalid.user@salesforce.com", "WrongPassword", false);
            String errorMsg = loginPage.getErrorMessage();
            Assert.assertTrue(errorMsg.contains("check your username and password"));
        } catch (Exception e) {
            Assert.fail(e.getMessage());
        }
    }

    @AfterTest
    public void tearDown() {
        if (driver != null) {
            try {
                driver.quit();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
    }
}
