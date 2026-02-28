export class SignupDto {
    email: string;
    password: string;
    name?: string;
}

export class LoginDto {
    email: string;
    password: string;
}

export class CreateStoreDto {
    name: string;
    address?: string;
}
