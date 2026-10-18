<?php

namespace Lab\LegacyHttp;

use PHPMailer\PHPMailer\PHPMailer;
use Symfony\Component\HttpFoundation\Request;

class LegacyHttp
{
    public function request(string $path): Request
    {
        return Request::create($path, "GET");
    }

    public function message(string $address, string $body): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->addAddress($address);
        $mail->Subject = "report";
        $mail->Body = $body;
        return $mail;
    }
}
