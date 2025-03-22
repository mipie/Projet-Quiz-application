import { Injectable } from '@nestjs/common';

@Injectable()
export class ConnexionMdpService {
    acceptedPassword: string[] = ['anis', 'michlove', 'ali', 'kevin', 'pungtz', 'mathieu'];

    async validateAcceptedPassword(passwordInput: string): Promise<boolean> {
        const allLowerCase = passwordInput.toLowerCase();
        return this.acceptedPassword.includes(allLowerCase);
    }
}
