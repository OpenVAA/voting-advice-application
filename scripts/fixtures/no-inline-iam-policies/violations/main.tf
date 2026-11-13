# The violating fixture root of the no-inline-IAM-policies guard. Each banned form appears once, starting
# on a line of its own; expected.violations lists the finding each one must produce.

resource "aws_iam_user" "sender" {
  name = "fixture-sender"
}

resource "aws_iam_user_policy" "sender" {
  user   = aws_iam_user.sender.name
  policy = jsonencode({ Version = "2012-10-17", Statement = [] })
}

resource "aws_iam_role" "app" {
  name               = "fixture-app"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [] })

  inline_policy {
    name   = "fixture-embedded"
    policy = jsonencode({ Version = "2012-10-17", Statement = [] })
  }
}

resource "aws_iam_role_policy" "app" {
  role   = aws_iam_role.app.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [] })
}

resource "aws_iam_group" "readers" {
  name = "fixture-readers"
}

resource "aws_iam_group_policy" "readers" {
  group  = aws_iam_group.readers.name
  policy = jsonencode({ Version = "2012-10-17", Statement = [] })
}

resource "aws_ssoadmin_permission_set_inline_policy" "admins" {
  instance_arn       = "arn:aws:sso:::instance/ssoins-0000000000000000"
  permission_set_arn = "arn:aws:sso:::permissionSet/ssoins-0000000000000000/ps-0000000000000000"
  inline_policy      = jsonencode({ Version = "2012-10-17", Statement = [] })
}

resource "aws_iam_policy_attachment" "everyone" {
  name       = "fixture-everyone"
  roles      = [aws_iam_role.app.name]
  policy_arn = "arn:aws:iam::aws:policy/ReadOnlyAccess"
}

resource "aws_iam_role_policies_exclusive" "app" {
  role_name    = aws_iam_role.app.name
  policy_names = ["fixture-embedded"]
}
