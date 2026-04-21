const COMMON_PASSWORDS = new Set<string>([
    "password",      "password1",     "password12",    "password123",
    "password1234",  "password12345", "password123456","123456789012",
    "qwerty123456",  "qwertyuiop12",  "iloveyou1234",  "welcome12345",
    "monkey123456",  "dragon123456",  "master123456",  "abc123456789",
    "letmein12345",  "sunshine1234",  "princess1234",  "football1234",
    "shadow123456",  "superman1234",  "michael1234!",  "jessica1234!",
    "charlie12345",  "donald123456",  "harley123456",  "ranger123456",
    "joshua123456",  "thomas123456",  "daniel123456",  "george123456",
    "jordan123456",  "andrew123456",  "hunter123456",  "robert123456",
    "joseph123456",  "buster123456",  "pepper123456",  "ginger123456",
    "merlin123456",  "welcome1234!",  "P@ssword1234",  "P@ssw0rd1234",
    "Admin@123456",  "Passw0rd1234",  "Summer123456",  "Winter123456",
    "Spring123456",  "Autumn123456",  "Monday123456",  "Sunday123456",
    "January12345",  "February1234",  "December1234",  "November1234",
    "October12345",  "asdfgh123456",  "zxcvbn123456",  "1qaz2wsx3edc",
    "qazwsxedc123",  "123qweasdzxc",  "pass@word1234", "test@1234567",
    "user@1234567",  "hello@123456",  "changeme1234",  "secret@12345",
    "trustno11234",  "welcome@1234",  "newpass@1234",  "oldpass@1234",
    "mypass@12345",  "yourpass1234",  "ourpass12345",  "thepass12345",
    "Qwerty@12345",  "Abc@12345678",  "Login@123456",  "System@12345",
    "Server@12345",  "Secure@12345",  "Access@12345",  "Network@1234",
    "Database1234",  "Trustno1234!",  "Changeme123!",  "Defaultp@ss1",
    "Companyname1",  "Neooffice123",  "Neooffice12!",  "Catalogue123",
    "Catalogue12!",  "Passw0rd123!",  "P@ssw0rd123!",  "qwerty12345!",
    "Qwerty12345!",  "Hello@12345!",  "Admin@12345!",  "Welcome@123!",
    "password!123",  "Password!123",
  ]);
  
  export function isCommonPassword(password: string): boolean {
    return COMMON_PASSWORDS.has(password);
  }
  
  export default COMMON_PASSWORDS;