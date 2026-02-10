# Page snapshot

```yaml
- generic [ref=e2]:
    - generic [ref=e4]:
        - generic [ref=e5]:
            - generic [ref=e6]:
                - img [ref=e7]
                - button [ref=e12]:
                    - img [ref=e13]
            - heading "Bienvenue" [level=3] [ref=e16]
            - paragraph [ref=e17]: Entrez vos identifiants pour accéder à votre compte
        - generic [ref=e19]:
            - generic [ref=e20]:
                - generic [ref=e21]: Téléphone / Email
                - textbox "Téléphone / Email" [ref=e22]:
                    - /placeholder: Téléphone
            - generic [ref=e23]:
                - generic [ref=e24]:
                    - generic [ref=e25]: Mot de passe
                    - link "Mot de passe oublié ?" [ref=e26] [cursor=pointer]:
                        - /url: /auth/reset-password
                - textbox "Mot de passe" [ref=e27]
            - button "Se connecter" [ref=e28]
            - generic [ref=e29]:
                - link "Envoyer OTP" [ref=e30] [cursor=pointer]:
                    - /url: /auth/login-otp
                - paragraph [ref=e31]:
                    - text: Vous n'avez pas de compte ?
                    - link "S'inscrire" [ref=e32] [cursor=pointer]:
                        - /url: /auth/register
    - button [ref=e33]:
        - img [ref=e34]
    - region "Notifications alt+T"
```
