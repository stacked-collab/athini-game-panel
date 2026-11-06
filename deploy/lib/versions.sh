#!/usr/bin/env bash
# Athini panel releases and compatible upstream image releases are independent.

read_package_json_version() {
  awk -F'"' '/"version"[[:space:]]*:/ { print $4; exit }' "$1"
}

read_package_json_image_version() {
  local package_file="$1"
  local image_version=""
  image_version="$(awk -F'"' '/"gamepanelImageVersion"[[:space:]]*:/ { value=$4; gsub(/^[[:space:]]+|[[:space:]]+$/, "", value); print value; exit }' "$package_file")"
  if [[ -n "$image_version" ]]; then
    printf '%s' "$image_version"
  else
    read_package_json_version "$package_file"
  fi
}

read_app_version() {
  local source_root="$1"
  local package_file="$source_root/backend/package.json"
  [[ -f "$package_file" ]] || die "Missing backend package.json file: $package_file"
  local version=""
  version="$(read_package_json_version "$package_file")"
  [[ -n "$version" ]] || die "Unable to read version from: $package_file"
  printf '%s' "$version"
}

read_image_version() {
  local source_root="$1"
  local package_file="$source_root/backend/package.json"
  [[ -f "$package_file" ]] || die "Missing backend package.json file: $package_file"
  local version=""
  version="$(read_package_json_image_version "$package_file")"
  [[ -n "$version" ]] || die "Unable to read image version from: $package_file"
  printf '%s' "${version#v}"
}

assert_app_versions_match() {
  local source_root="$1"
  local backend_version frontend_version backend_image_version frontend_image_version
  backend_version="$(read_package_json_version "$source_root/backend/package.json")"
  frontend_version="$(read_package_json_version "$source_root/frontend/package.json")"
  [[ -n "$backend_version" ]] || die "Unable to read backend version from $source_root/backend/package.json"
  [[ -n "$frontend_version" ]] || die "Unable to read frontend version from $source_root/frontend/package.json"
  [[ "$backend_version" == "$frontend_version" ]] || \
    die "Version mismatch: backend=$backend_version, frontend=$frontend_version (they must be identical)."
  backend_image_version="$(read_package_json_image_version "$source_root/backend/package.json")"
  frontend_image_version="$(read_package_json_image_version "$source_root/frontend/package.json")"
  [[ "$backend_image_version" == "$frontend_image_version" ]] || \
    die "Image version mismatch: backend=$backend_image_version, frontend=$frontend_image_version (they must be identical)."
}
