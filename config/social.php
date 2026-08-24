<?php

return [
    'hidden_account_emails' => array_values(array_filter(array_map(
        fn (string $email) => strtolower(trim($email)),
        explode(',', env('HIDDEN_SOCIAL_ACCOUNT_EMAILS', 'test.admin@lst.test'))
    ))),
];
