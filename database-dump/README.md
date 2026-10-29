# Everstill MongoDB Database Dump

This folder contains a MongoDB BSON export of the `test` database.

## Contents

The BSON files contain exported collections such as users, posts, comments, friendships, albums, reports, and notifications.

## Restore

Install MongoDB Database Tools, then run the following from PowerShell, replacing the URI with your own MongoDB connection string:

mongorestore --uri="<YOUR_MONGODB_URI>" --nsInclude="test.*" "./database-dump"

Review the target database before restoring. Do not use a production database unintentionally.

## Important

This is a database backup, separate from the application source code. Keep credentials and environment files out of version control.
