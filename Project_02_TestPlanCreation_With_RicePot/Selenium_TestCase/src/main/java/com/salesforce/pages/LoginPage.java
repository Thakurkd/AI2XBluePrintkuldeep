package com.salesforce.pages;

import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class LoginPage {
    private WebDriver driver;
    private WebDriverWait wait;

    @FindBy(xpath = "//input[@id='username']")
    private WebElement usernameInput;

    @FindBy(xpath = "//input[@id='password']")
    private WebElement passwordInput;

    @FindBy(xpath = "//input[@id='Login']")
    private WebElement loginButton;

    @FindBy(xpath = "//input[@id='rememberUn']")
    private WebElement rememberMeCheckbox;

    @FindBy(xpath = "//div[@id='error']")
    private WebElement errorMessage;

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
        PageFactory.initElements(driver, this);
    }

    public void login(String username, String password, boolean rememberMe) {
        try {
            wait.until(ExpectedConditions.visibilityOf(usernameInput)).clear();
            usernameInput.sendKeys(username);
            
            wait.until(ExpectedConditions.visibilityOf(passwordInput)).clear();
            passwordInput.sendKeys(password);
            
            if (rememberMe) {
                WebElement checkbox = wait.until(ExpectedConditions.elementToBeClickable(rememberMeCheckbox));
                if (!checkbox.isSelected()) {
                    checkbox.click();
                }
            }
            
            wait.until(ExpectedConditions.elementToBeClickable(loginButton)).click();
        } catch (TimeoutException e) {
            throw new RuntimeException(e);
        }
    }

    public String getErrorMessage() {
        try {
            return wait.until(ExpectedConditions.visibilityOf(errorMessage)).getText();
        } catch (TimeoutException e) {
            throw new RuntimeException(e);
        }
    }
    
    public boolean isTitleDisplayed(String titlePart) {
        try {
            return wait.until(ExpectedConditions.titleContains(titlePart));
        } catch (TimeoutException e) {
            throw new RuntimeException(e);
        }
    }
}
