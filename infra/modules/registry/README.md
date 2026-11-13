# Image registry module

Creates one Amazon ECR repository for the frontend image and a lifecycle policy for it.

- Tags are immutable (`image_tag_mutability = "IMMUTABLE"`): once a tag is pushed, it always names the same image.
- Every image is scanned on push.
- `force_delete` is off, so the repository is not deleted while it still holds images.

## Inputs

| Variable               | Default | Meaning                                     |
| ---------------------- | ------- | ------------------------------------------- |
| `repository_name`      | none    | Name of the repository                      |
| `untagged_expiry_days` | `7`     | Untagged images older than this are expired |
| `max_images`           | `50`    | Number of newest images the policy keeps    |

## Limit: how far back a rollback can reach

Because tags are immutable, every deployment adds an image. The lifecycle policy keeps only the newest `max_images` images and expires the rest. An expired image cannot be deployed again, so `max_images` bounds how far back a rollback can reach.

The default stays at 50. Whoever builds the deployment pipeline must keep `max_images` above the number of images pushed within the window a rollback has to cover, or raise it.
